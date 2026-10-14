<?php
// TCS courier integration endpoint — booking, tracking, labels, cancel.
//
//   GET  ?action=shipments               seller/admin: shipments + orders waiting to ship
//   POST ?action=ship&order_id=N         book a TCS consignment for the order (stores CN)
//   POST ?action=track&order_id=N        refresh one shipment's tracking (owner or seller)
//   POST ?action=refresh_all             seller/admin: refresh every active shipment
//   GET  ?action=tracking&order_id=N     owner or seller: tracking timeline + CN (customer side)
//   GET  ?action=label&order_id=N        owner or seller: shipping label PDF (CN printed)
//   POST ?action=cancel&order_id=N       seller/admin: cancel the TCS booking
//
// Works fully in demo mode until TCS credentials are provided (see core/tcs_client.php).
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(); }

require_once '../core/database.php';
require_once '../core/jwt_helper.php';
require_once '../core/socket_helper.php';
require_once '../core/tcs_client.php';

$database = new Database();
$db = $database->getConnection();
$jwt = new JWTHelper();
$tcs = new TcsClient();

$userId = $jwt->validateTokenAndGetUserId();
$role = $jwt->getRole();
if (!$userId) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';
$orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;

// ── helpers ──────────────────────────────────────────────────────────

function loadOrderFull($db, $orderId)
{
    $stmt = $db->prepare("SELECT o.*, u.full_name AS customer_name, u.phone AS customer_phone, u.email AS customer_email
                          FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = :id");
    $stmt->bindParam(':id', $orderId, PDO::PARAM_INT);
    $stmt->execute();
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) return null;

    $items = $db->prepare("SELECT oi.quantity, oi.price, p.name
                           FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
                           WHERE oi.order_id = :id");
    $items->bindParam(':id', $orderId, PDO::PARAM_INT);
    $items->execute();
    $order['items'] = $items->fetchAll(PDO::FETCH_ASSOC);
    return $order;
}

function isSellerOfOrder($db, $userId, $orderId)
{
    $stmt = $db->prepare("SELECT 1 FROM order_items oi
                          JOIN products p ON p.id = oi.product_id
                          JOIN sellers s ON s.id = p.seller_id
                          WHERE oi.order_id = :oid AND s.user_id = :uid LIMIT 1");
    $stmt->bindParam(':oid', $orderId, PDO::PARAM_INT);
    $stmt->bindParam(':uid', $userId, PDO::PARAM_INT);
    $stmt->execute();
    return (bool)$stmt->fetchColumn();
}

// Free-text address ("street, area (area) | Phone: 03...") -> booking fields
function extractAddress($order)
{
    $raw = (string)($order['shipping_address'] ?? '');
    $phone = $order['customer_phone'] ?? '';
    if (preg_match('/Phone:\s*([0-9+\-\s()]{7,20})/i', $raw, $m)) {
        $phone = trim($m[1]);
        $raw = trim(str_replace($m[0], '', $raw));
        $raw = rtrim($raw, ' |,');
    }
    // TCS requires an 11-digit mobile
    $digits = preg_replace('/[^0-9]/', '', (string)$phone);
    if (strlen($digits) > 11) $digits = substr($digits, -11);
    if (strlen($digits) < 11) $digits = str_pad($digits, 11, '0', STR_PAD_LEFT);

    return [
        'name'    => $order['customer_name'] ?? 'Customer',
        'phone'   => $digits,
        'address' => $raw !== '' ? $raw : 'Address on file',
        'city'    => conf_city(),
    ];
}

function conf_city()
{
    $c = getenv('TCS_DEFAULT_CITY');
    return ($c !== false && $c !== '') ? $c : (defined('TCS_DEFAULT_CITY') ? TCS_DEFAULT_CITY : 'KARACHI');
}

// payment_method values vary ('cod', 'Cash on Delivery', card names, ...)
function isCodPayment($method)
{
    $m = strtolower(trim((string)$method));
    return $m === 'cod' || strpos($m, 'cash') !== false;
}

function saveEvents($db, $orderId, $cn, array $checkpoints)
{
    $inserted = 0;
    $ins = $db->prepare("INSERT INTO tcs_tracking_events (order_id, cn, status_code, status_text, location, checkpoint_at, raw_json)
                         SELECT :oid, :cn, :code, :text, :loc, :at, :raw FROM DUAL
                         WHERE NOT EXISTS (SELECT 1 FROM tcs_tracking_events
                                           WHERE order_id = :oid2 AND status_text = :text2
                                           AND COALESCE(checkpoint_at, '') = COALESCE(:at2, ''))");
    foreach ($checkpoints as $cp) {
        $ins->execute([
            ':oid' => $orderId, ':cn' => $cn,
            ':code' => $cp['status_code'] ?? '', ':text' => $cp['status_text'] ?? '',
            ':loc' => $cp['location'] ?? '', ':at' => $cp['checkpoint_at'] ?? null,
            ':raw' => json_encode($cp),
            ':oid2' => $orderId, ':text2' => $cp['status_text'] ?? '', ':at2' => $cp['checkpoint_at'] ?? null,
        ]);
        $inserted += $ins->rowCount();
    }
    return $inserted;
}

// Refresh one shipment from TCS (or demo), update the order, emit socket.
function refreshShipment($db, $tcs, array $order)
{
    $cn = $order['tcs_cn'];
    $bookedAt = $order['tcs_booked_at'] ?? $order['created_at'];

    if ($tcs->isConfigured()) {
        $res = $tcs->trackConsignments([$cn]);
        $checkpoints = $res['checkpoints'];
        if (!$res['ok']) {
            return ['ok' => false, 'error' => $res['error']];
        }
    } else {
        $checkpoints = $tcs->demoCheckpoints($cn, $bookedAt);
    }

    // newest first -> store all, take latest as current status
    saveEvents($db, (int)$order['id'], $cn, $checkpoints);

    $latest = $checkpoints[0] ?? null;
    $newOrderStatus = null;
    if ($latest) {
        $mapped = TcsClient::mapStatus($latest['status_text'] ?? '', $latest['status_code'] ?? '');
        $codPaid = $mapped['done'] && isCodPayment($order['payment_method']) ? 'paid' : ($order['cod_paid_status'] ?? null);
        $upd = $db->prepare("UPDATE orders SET tcs_status = :st, tcs_status_code = :code, tcs_updated_at = NOW()
                             " . ($codPaid ? ", cod_paid_status = :cod " : "") . " WHERE id = :id");
        $upd->bindValue(':st', ($latest['status_text'] ?? ''));
        $upd->bindValue(':code', ($latest['status_code'] ?? ''));
        if ($codPaid) $upd->bindValue(':cod', $codPaid);
        $upd->bindParam(':id', $order['id'], PDO::PARAM_INT);
        $upd->execute();

        if ($order['order_status'] !== $mapped['order_status']) {
            $newOrderStatus = $mapped['order_status'];
            $su = $db->prepare("UPDATE orders SET order_status = :s, updated_at = NOW() WHERE id = :id");
            $su->bindParam(':s', $newOrderStatus);
            $su->bindParam(':id', $order['id'], PDO::PARAM_INT);
            $su->execute();

            // live update to customer + seller dashboards
            try {
                SocketHelper::emit('order_status_updated', [
                    'order_id'  => (int)$order['id'],
                    'user_id'   => (int)$order['user_id'],
                    'status'    => $newOrderStatus,
                    'tcs_cn'    => $cn,
                    'tcs_status'=> $latest['status_text'] ?? '',
                ]);
            } catch (Exception $e) { /* socket server offline — ignore */ }
        }
    }
    return ['ok' => true, 'events' => $checkpoints];
}

function trackingPayload($db, $order, $tcs)
{
    $stmt = $db->prepare("SELECT status_code, status_text, location, checkpoint_at FROM tcs_tracking_events
                          WHERE order_id = :id ORDER BY COALESCE(checkpoint_at, created_at) DESC, id DESC LIMIT 40");
    $stmt->bindParam(':id', $order['id'], PDO::PARAM_INT);
    $stmt->execute();
    return [
        'order_id'    => (int)$order['id'],
        'tcs_cn'      => $order['tcs_cn'],
        'tcs_status'  => $order['tcs_status'],
        'order_status'=> $order['order_status'],
        'cod_amount'  => isCodPayment($order['payment_method']) ? (float)$order['total_amount'] : 0,
        'cod_paid'    => $order['cod_paid_status'],
        'booked_at'   => $order['tcs_booked_at'],
        'mode'        => $tcs->mode(),
        'events'      => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ];
}

// ── ACTIONS ──────────────────────────────────────────────────────────

// Seller/admin: shipments + ready-to-ship queue
if ($action === 'shipments' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($role != 'seller' && $role != 'admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Sellers only"]);
        exit();
    }

    // Orders waiting to ship (no CN yet, not cancelled)
    $pendingStmt = $db->prepare("SELECT o.id, o.total_amount, o.payment_method, o.shipping_address, o.order_status, o.created_at,
                                  u.full_name AS customer_name, u.phone AS customer_phone,
                                  GROUP_CONCAT(CONCAT(p.name, ' x', oi.quantity) SEPARATOR ', ') AS items_summary
                           FROM orders o
                           JOIN order_items oi ON oi.order_id = o.id
                           JOIN products p ON p.id = oi.product_id
                           JOIN sellers s ON s.id = p.seller_id
                           LEFT JOIN users u ON u.id = o.user_id
                           WHERE s.user_id = :uid AND o.tcs_cn IS NULL
                             AND o.order_status IN ('pending','confirmed')
                           GROUP BY o.id
                           ORDER BY o.created_at DESC
                           LIMIT 50");
    $pendingStmt->execute([':uid' => $userId]);
    $pending = $pendingStmt->fetchAll(PDO::FETCH_ASSOC);

    // Active + past shipments
    $shippedStmt = $db->prepare("SELECT o.id, o.total_amount, o.payment_method, o.order_status, o.created_at,
                                  o.tcs_cn, o.tcs_status, o.tcs_status_code, o.cod_paid_status,
                                  o.tcs_booked_at, o.tcs_updated_at,
                                  u.full_name AS customer_name, u.phone AS customer_phone,
                                  GROUP_CONCAT(CONCAT(p.name, ' x', oi.quantity) SEPARATOR ', ') AS items_summary
                           FROM orders o
                           JOIN order_items oi ON oi.order_id = o.id
                           JOIN products p ON p.id = oi.product_id
                           JOIN sellers s ON s.id = p.seller_id
                           LEFT JOIN users u ON u.id = o.user_id
                           WHERE s.user_id = :uid AND o.tcs_cn IS NOT NULL
                           GROUP BY o.id
                           ORDER BY o.tcs_updated_at DESC, o.id DESC
                           LIMIT 50");
    $shippedStmt->execute([':uid' => $userId]);
    $shipped = $shippedStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($shipped as &$sh) {
        $mapped = TcsClient::mapStatus($sh['tcs_status'] ?? '', $sh['tcs_status_code'] ?? '');
        $sh['status_label'] = $mapped['label'];
    }
    unset($sh);

    echo json_encode([
        "status" => "success",
        "data" => [
            "mode"           => $tcs->mode(),
            "pending_orders" => $pending,
            "shipments"      => $shipped,
        ]
    ]);
    exit();
}

// Book a shipment
if ($action === 'ship' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($role != 'seller' && $role != 'admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Sellers only"]);
        exit();
    }
    $order = loadOrderFull($db, $orderId);
    if (!$order) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Order not found"]);
        exit();
    }
    if ($role !== 'admin' && !isSellerOfOrder($db, $userId, $orderId)) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Not your order"]);
        exit();
    }
    if (!empty($order['tcs_cn'])) {
        echo json_encode(["status" => "error", "message" => "Order already has CN " . $order['tcs_cn']]);
        exit();
    }

    $addr = extractAddress($order);
    $totalItems = array_sum(array_map(function ($i) { return (int)$i['quantity']; }, $order['items']));
    $weight = 0;
    foreach ($order['items'] as $it) {
        $weight += max(0.5, (float)($it['weight'] ?? 0.5)) * (int)$it['quantity'];
    }

    $res = $tcs->bookShipment([
        'name'        => $addr['name'],
        'phone'       => $addr['phone'],
        'address'     => $addr['address'],
        'city'        => $addr['city'],
        'cod'         => isCodPayment($order['payment_method']) ? (float)$order['total_amount'] : 0,
        'unit_price'  => (float)$order['total_amount'] / max(1, $totalItems),
        'weight'      => max(0.5, $weight),
        'description' => $order['items_summary'] ?? implode(', ', array_map(function ($i) { return $i['name']; }, $order['items'])),
        'reference'   => 'ORDER-' . $order['id'],
    ]);

    if (!$res['ok']) {
        http_response_code(502);
        echo json_encode(["status" => "error", "message" => $res['error']]);
        exit();
    }

    $upd = $db->prepare("UPDATE orders SET tcs_cn = :cn, tcs_status = 'BOOKED', tcs_status_code = 'BOOKED',
                         tcs_booked_at = NOW(), tcs_updated_at = NOW(),
                         cod_paid_status = IF(payment_method IN ('COD','cod','Cash on Delivery'), 'unpaid', NULL)
                         WHERE id = :id");
    $upd->bindParam(':cn', $res['cn']);
    $upd->bindParam(':id', $orderId, PDO::PARAM_INT);
    $upd->execute();

    // first checkpoint: booked (use the DB clock so it matches tcs_booked_at)
    saveEvents($db, $orderId, $res['cn'], [[
        'status_code' => 'BOOKED', 'status_text' => 'Shipment booked with TCS',
        'location' => conf_city(), 'checkpoint_at' => $db->query('SELECT NOW()')->fetchColumn(),
    ]]);

    // booked with the courier -> order moves to shipped
    $su = $db->prepare("UPDATE orders SET order_status = 'shipped', updated_at = NOW() WHERE id = :id AND order_status IN ('pending','confirmed')");
    $su->bindParam(':id', $orderId, PDO::PARAM_INT);
    $su->execute();

    try {
        SocketHelper::emit('order_status_updated', [
            'order_id'  => $orderId,
            'user_id'   => (int)$order['user_id'],
            'status'    => 'shipped',
            'tcs_cn'    => $res['cn'],
            'tcs_status'=> 'BOOKED',
        ]);
    } catch (Exception $e) { }

    echo json_encode([
        "status" => "success",
        "message" => "Booked with TCS",
        "data" => ["order_id" => $orderId, "tcs_cn" => $res['cn'], "mode" => $tcs->mode()]
    ]);
    exit();
}

// Refresh one shipment (owner or seller)
if ($action === 'track' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $order = loadOrderFull($db, $orderId);
    if (!$order) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Order not found"]);
        exit();
    }
    $isOwner = (int)$order['user_id'] === (int)$userId;
    $isSeller = isSellerOfOrder($db, $userId, $orderId);
    if (!$isOwner && !$isSeller && $role !== 'admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Not your order"]);
        exit();
    }
    if (empty($order['tcs_cn'])) {
        echo json_encode(["status" => "success", "data" => trackingPayload($db, $order, $tcs)]);
        exit();
    }

    $res = refreshShipment($db, $tcs, $order);
    if (!$res['ok']) {
        http_response_code(502);
        echo json_encode(["status" => "error", "message" => $res['error']]);
        exit();
    }
    $fresh = loadOrderFull($db, $orderId);
    echo json_encode(["status" => "success", "data" => trackingPayload($db, $fresh, $tcs)]);
    exit();
}

// Customer/seller: tracking timeline (refreshes demo/live quietly)
if ($action === 'tracking' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $order = loadOrderFull($db, $orderId);
    if (!$order) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Order not found"]);
        exit();
    }
    $isOwner = (int)$order['user_id'] === (int)$userId;
    $isSeller = isSellerOfOrder($db, $userId, $orderId);
    if (!$isOwner && !$isSeller && $role !== 'admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Not your order"]);
        exit();
    }
    if (!empty($order['tcs_cn'])) {
        refreshShipment($db, $tcs, $order);
        $order = loadOrderFull($db, $orderId);
    }
    echo json_encode(["status" => "success", "data" => trackingPayload($db, $order, $tcs)]);
    exit();
}

// Refresh every active shipment (seller/admin; also used by demo polling)
if ($action === 'refresh_all' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($role != 'seller' && $role != 'admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Sellers only"]);
        exit();
    }
    $activeStmt = $db->prepare("SELECT o.* FROM orders o
                          JOIN order_items oi ON oi.order_id = o.id
                          JOIN products p ON p.id = oi.product_id
                          JOIN sellers s ON s.id = p.seller_id
                          WHERE s.user_id = :uid AND o.tcs_cn IS NOT NULL
                            AND o.order_status NOT IN ('delivered','cancelled','returned')
                          GROUP BY o.id
                          LIMIT 100");
    $activeStmt->execute([':uid' => $userId]);
    $active = $activeStmt->fetchAll(PDO::FETCH_ASSOC);
    $ok = 0; $failed = 0;
    foreach ($active as $ord) {
        $res = refreshShipment($db, $tcs, $ord);
        $res['ok'] ? $ok++ : $failed++;
    }
    echo json_encode(["status" => "success", "data" => ["refreshed" => $ok, "failed" => $failed, "mode" => $tcs->mode()]]);
    exit();
}

// Label PDF (streams application/pdf — auth via Bearer header)
if ($action === 'label' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $order = loadOrderFull($db, $orderId);
    if (!$order) { http_response_code(404); echo json_encode(["status" => "error", "message" => "Order not found"]); exit(); }
    $isOwner = (int)$order['user_id'] === (int)$userId;
    $isSeller = isSellerOfOrder($db, $userId, $orderId);
    if (!$isOwner && !$isSeller && $role !== 'admin') {
        http_response_code(403); echo json_encode(["status" => "error", "message" => "Not your order"]); exit();
    }
    if (empty($order['tcs_cn'])) {
        http_response_code(400); echo json_encode(["status" => "error", "message" => "Order has no TCS booking yet"]); exit();
    }

    $res = $tcs->getLabelPdf($order['tcs_cn'], [
        'order_id'  => $orderId,
        'name'      => $order['customer_name'] ?? 'Customer',
        'phone'     => $order['customer_phone'] ?? '-',
        'address'   => $order['shipping_address'] ?? '',
        'cod'       => isCodPayment($order['payment_method']) ? (float)$order['total_amount'] : 0,
        'mode'      => $tcs->mode(),
    ]);
    if (!$res['ok']) {
        http_response_code(502); echo json_encode(["status" => "error", "message" => $res['error']]); exit();
    }

    // cache the label on disk
    $dir = '../uploads/tcs/labels';
    if (!is_dir($dir)) @mkdir($dir, 0777, true);
    $path = $dir . '/label_' . preg_replace('/[^A-Za-z0-9_-]/', '', $order['tcs_cn']) . '.pdf';
    @file_put_contents($path, $res['pdf']);

    header("Content-Type: application/pdf");
    header("Content-Disposition: inline; filename=\"TCS_Label_" . $order['tcs_cn'] . ".pdf\"");
    header("Content-Length: " . strlen($res['pdf']));
    echo $res['pdf'];
    exit();
}

// Cancel booking (seller/admin)
if ($action === 'cancel' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($role != 'seller' && $role != 'admin') {
        http_response_code(403); echo json_encode(["status" => "error", "message" => "Sellers only"]); exit();
    }
    $order = loadOrderFull($db, $orderId);
    if (!$order || empty($order['tcs_cn'])) {
        http_response_code(404); echo json_encode(["status" => "error", "message" => "No TCS booking for this order"]); exit();
    }
    $res = $tcs->cancelBooking($order['tcs_cn']);
    if (!$res['ok']) {
        http_response_code(502); echo json_encode(["status" => "error", "message" => $res['error']]); exit();
    }
    $upd = $db->prepare("UPDATE orders SET tcs_status = 'CANCELLED', tcs_status_code = 'CANCELLED', tcs_updated_at = NOW() WHERE id = :id");
    $upd->bindParam(':id', $orderId, PDO::PARAM_INT);
    $upd->execute();
    echo json_encode(["status" => "success", "message" => "Booking cancelled"]);
    exit();
}

http_response_code(400);
echo json_encode(["status" => "error", "message" => "Unknown action"]);
?>
