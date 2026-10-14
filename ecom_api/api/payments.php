<?php
// Stripe payment gateway endpoint.
//
//   GET  ?action=mode                         which mode we run in + publishable key
//   POST ?action=create                       create order + Stripe Checkout Session
//        body: { total, address, payment_method, items[], origin }
//        -> { order_id, session_id, mode, url }
//   POST ?action=confirm                      confirm payment (demo: simulate, live: verify session)
//        body: { order_id, session_id, card_number? }
//        -> marks order paid, clears cart, notifies shop
//   POST ?action=webhook                      Stripe webhook (signature-verified, authoritative)
//
// Works fully in demo mode until a Stripe secret key is provided (see core/stripe_client.php).
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(); }

require_once '../core/database.php';
require_once '../core/jwt_helper.php';
require_once '../core/socket_helper.php';
require_once '../core/stripe_client.php';

$database = new Database();
$db = $database->getConnection();
$jwt = new JWTHelper();
$stripe = new StripeClient();

$action = isset($_GET['action']) ? $_GET['action'] : '';

// ─── Webhook is unauthenticated (called by Stripe) — handle first ────────
if ($action === 'webhook') {
    handleWebhook($db, $stripe);
    exit();
}

$userId = $jwt->validateTokenAndGetUserId();
if (!$userId) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

// ─── Mode ────────────────────────────────────────────────────────────────
if ($action === 'mode') {
    echo json_encode([
        "status" => "success",
        "data"   => [
            "mode"             => $stripe->mode(),
            "currency"         => strtoupper($stripe->currency()),
            "publishable_key"  => $stripe->publishableKey(),
        ],
    ]);
    exit();
}

// ─── Create order + checkout session ────────────────────────────────────
if ($action === 'create') {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true) ?: $_POST;

    $items          = isset($data['items']) ? (array)$data['items'] : [];
    $address        = isset($data['address']) ? $data['address'] : '';
    $paymentMethod  = isset($data['payment_method']) ? $data['payment_method'] : 'Card (Stripe)';
    $origin         = isset($data['origin']) ? $data['origin'] : 'http://localhost:5173';

    if (empty($items)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Cart is empty"]);
        exit();
    }

    // Server-side total so the charged amount can never drift from the order.
    $total = 0;
    foreach ($items as $it) {
        $qty = is_array($it) ? (int)($it['quantity'] ?? 1) : 1;
        $price = is_array($it) ? (float)($it['price'] ?? 0) : 0;
        $total += $qty * $price;
    }

    try {
        $db->beginTransaction();

        $q = "INSERT INTO orders (user_id, total, total_amount, order_status, shipping_address, payment_method, payment_status)
              VALUES (:uid, :total, :total_amount, 'pending', :address, :method, 'pending')";
        $stmt = $db->prepare($q);
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':total', $total);
        $stmt->bindValue(':total_amount', $total);
        $stmt->bindValue(':address', $address);
        $stmt->bindValue(':method', $paymentMethod);
        $stmt->execute();
        $orderId = $db->lastInsertId();

        foreach ($items as $it) {
            $pid = is_array($it) ? (int)($it['product_id'] ?? 0) : 0;
            $qty = is_array($it) ? (int)($it['quantity'] ?? 1) : 1;
            $price = is_array($it) ? (float)($it['price'] ?? 0) : 0;
            $si = $db->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (:o, :p, :q, :pr)");
            $si->bindValue(':o', $orderId, PDO::PARAM_INT);
            $si->bindValue(':p', $pid, PDO::PARAM_INT);
            $si->bindValue(':q', $qty, PDO::PARAM_INT);
            $si->bindValue(':pr', $price);
            $si->execute();
        }

        $orderRow = $db->prepare("SELECT * FROM orders WHERE id = :id");
        $orderRow->bindValue(':id', $orderId, PDO::PARAM_INT);
        $orderRow->execute();
        $order = $orderRow->fetch(PDO::FETCH_ASSOC);

        $db->commit();
    } catch (Exception $e) {
        if ($db->inTransaction()) $db->rollBack();
        echo json_encode(["status" => "error", "message" => "Could not create order: " . $e->getMessage()]);
        exit();
    }

    // Customer email for Stripe (optional nicety).
    $emailStmt = $db->prepare("SELECT email FROM users WHERE id = :uid");
    $emailStmt->bindValue(':uid', $userId, PDO::PARAM_INT);
    $emailStmt->execute();
    $email = (string)$emailStmt->fetchColumn();

    $session = $stripe->createCheckoutSession($order, $origin, $email);
    if (!$session['ok']) {
        echo json_encode(["status" => "error", "message" => $session['error']]);
        exit();
    }

    // Remember the session on the order so the webhook/confirm can find it.
    $us = $db->prepare("UPDATE orders SET stripe_session_id = :sid WHERE id = :id");
    $us->bindValue(':sid', $session['session_id']);
    $us->bindValue(':id', $orderId, PDO::PARAM_INT);
    $us->execute();

    echo json_encode([
        "status"     => "success",
        "data"       => [
            "order_id"   => (int)$orderId,
            "session_id" => $session['session_id'],
            "mode"       => $stripe->mode(),
            "url"        => $session['url'],
            "total"      => (float)$order['total_amount'],
            "currency"   => strtoupper($stripe->currency()),
        ],
    ]);
    exit();
}

// ─── Confirm payment ────────────────────────────────────────────────────
if ($action === 'confirm') {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true) ?: $_POST;

    $orderId   = isset($data['order_id']) ? (int)$data['order_id'] : 0;
    $sessionId = isset($data['session_id']) ? $data['session_id'] : '';
    $card      = isset($data['card_number']) ? preg_replace('/\D/', '', $data['card_number']) : '';

    $order = loadOrder($db, $orderId);
    if (!$order || (int)$order['user_id'] !== (int)$userId) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Order not found"]);
        exit();
    }

    // Idempotent: already paid.
    if ($order['payment_status'] === 'paid') {
        echo json_encode(["status" => "success", "data" => ["order_id" => $orderId, "already_paid" => true]]);
        exit();
    }

    $intent = '';

    if ($stripe->mode() === 'demo') {
        // Simulate Stripe's well-known test card outcomes.
        if ($card !== '' && $card === '4000000000000002') {
            markFailed($db, $orderId);
            echo json_encode(["status" => "error", "message" => "Your card was declined. Try 4242 4242 4242 4242."]);
            exit();
        }
        $intent = 'pi_demo_' . bin2hex(random_bytes(10));
    } else {
        $retrieved = $stripe->retrieveSession($sessionId !== '' ? $sessionId : (string)$order['stripe_session_id']);
        if (!$retrieved['ok']) {
            echo json_encode(["status" => "error", "message" => $retrieved['error']]);
            exit();
        }
        if (!$retrieved['paid']) {
            echo json_encode(["status" => "error", "message" => "Payment not completed yet."]);
            exit();
        }
        $intent = $retrieved['payment_intent'];
    }

    finalizePayment($db, $orderId, $intent);
    echo json_encode(["status" => "success", "data" => ["order_id" => $orderId, "paid" => true]]);
    exit();
}

echo json_encode(["status" => "error", "message" => "Unknown action"]);
exit();

// ─── Helpers ─────────────────────────────────────────────────────────────

function loadOrder($db, $orderId)
{
    $stmt = $db->prepare("SELECT * FROM orders WHERE id = :id");
    $stmt->bindValue(':id', $orderId, PDO::PARAM_INT);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function markFailed($db, $orderId)
{
    $stmt = $db->prepare("UPDATE orders SET payment_status = 'failed', updated_at = NOW() WHERE id = :id");
    $stmt->bindValue(':id', $orderId, PDO::PARAM_INT);
    $stmt->execute();
}

// Mark the order paid, clear the cart and alert the shop. Safe to call more
// than once — it no-ops if the order is already paid.
function finalizePayment($db, $orderId, $intent = '')
{
    $order = loadOrder($db, $orderId);
    if (!$order || $order['payment_status'] === 'paid') return;

    $up = "UPDATE orders SET payment_status = 'paid', paid_at = NOW(),
           order_status = 'confirmed', stripe_payment_intent = :pi, updated_at = NOW()
           WHERE id = :id AND payment_status <> 'paid'";
    $stmt = $db->prepare($up);
    $stmt->bindValue(':pi', $intent);
    $stmt->bindValue(':id', $orderId, PDO::PARAM_INT);
    $stmt->execute();

    // Clear the buyer's cart now that payment is secured.
    $cc = $db->prepare("DELETE FROM cart WHERE user_id = :uid");
    $cc->bindValue(':uid', (int)$order['user_id'], PDO::PARAM_INT);
    $cc->execute();

    // Real-time notify the shop.
    try {
        $custQuery = $db->prepare("SELECT full_name FROM users WHERE id = :uid");
        $custQuery->bindValue(':uid', (int)$order['user_id'], PDO::PARAM_INT);
        $custQuery->execute();
        $customerName = $custQuery->fetchColumn() ?: 'Customer';

        SocketHelper::emit('order_placed', [
            'orderId'       => $orderId,
            'userId'        => (int)$order['user_id'],
            'customerName'  => $customerName,
            'total'         => (float)$order['total_amount'],
            'status'        => 'confirmed',
            'paymentMethod' => $order['payment_method'],
        ]);
    } catch (Exception $e) {
        // Ignore socket server connection error
    }

    // Push notifications (customer + sellers).
    try {
        require_once '../core/fcm_helper.php';
        $fcm = new FCMHelper();

        $uq = $db->prepare("SELECT fcm_token FROM users WHERE id = :uid");
        $uq->bindValue(':uid', (int)$order['user_id'], PDO::PARAM_INT);
        $uq->execute();
        $userFcm = $uq->fetchColumn();
        if ($userFcm) {
            $title = "Payment Received! 💳";
            $body  = "Your payment for order #$orderId was successful. We'll notify you once it ships.";
            $fcm->sendNotification($userFcm, $title, $body, ["order_id" => $orderId, "type" => "order_placed"]);
            $fcm->saveToHistory($db, (int)$order['user_id'], $title, $body, "order_placed");
        }

        $sq = $db->prepare("SELECT DISTINCT s.user_id, u.fcm_token
                            FROM order_items oi
                            JOIN products p ON oi.product_id = p.id
                            JOIN sellers s ON p.seller_id = s.id
                            JOIN users u ON s.user_id = u.id
                            WHERE oi.order_id = :oid");
        $sq->bindValue(':oid', $orderId, PDO::PARAM_INT);
        $sq->execute();
        foreach ($sq->fetchAll(PDO::FETCH_ASSOC) as $seller) {
            if ($seller['fcm_token']) {
                $title = "New Paid Order! 💳";
                $body  = "Order #$orderId is paid and ready to ship. Check your dashboard.";
                $fcm->sendNotification($seller['fcm_token'], $title, $body, ["order_id" => $orderId, "type" => "new_order"]);
                $fcm->saveToHistory($db, (int)$seller['user_id'], $title, $body, "new_order");
            }
        }
    } catch (Exception $e) {
        error_log("Payment notification error for order $orderId: " . $e->getMessage());
    }
}

// Stripe webhook — the authoritative record of a successful payment.
function handleWebhook($db, $stripe)
{
    $payload   = file_get_contents("php://input");
    $sigHeader = isset($_SERVER['HTTP_STRIPE_SIGNATURE']) ? $_SERVER['HTTP_STRIPE_SIGNATURE'] : '';

    if (!$stripe->verifyWebhookSignature($payload, $sigHeader)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid webhook signature"]);
        return;
    }

    $event = json_decode($payload, true);
    $type  = $event['type'] ?? '';

    if ($type === 'checkout.session.completed' || $type === 'checkout.session.async_payment_succeeded') {
        $session = $event['data']['object'] ?? [];
        $sessionId = $session['id'] ?? '';
        $orderId = (int)($session['metadata']['order_id'] ?? ($session['client_reference_id'] ?? 0));

        if (!$orderId && $sessionId !== '') {
            $bySid = $db->prepare("SELECT id FROM orders WHERE stripe_session_id = :sid");
            $bySid->bindValue(':sid', $sessionId);
            $bySid->execute();
            $orderId = (int)$bySid->fetchColumn();
        }

        if ($orderId && (($session['payment_status'] ?? '') === 'paid')) {
            $intent = $session['payment_intent'] ?? '';
            if (is_array($intent)) $intent = $intent['id'] ?? '';
            finalizePayment($db, $orderId, (string)$intent);
        }
    }

    // Always acknowledge so Stripe stops retrying.
    echo json_encode(["status" => "success"]);
}
?>
