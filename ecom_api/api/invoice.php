<?php
// Customer invoice PDF — GET /api/invoice.php?order_id=N
// Owner, the order's seller, or admin. Prints the TCS consignment number
// (CN) when the order has been booked with the courier.
header("Access-Control-Allow-Origin: *");

require_once '../core/database.php';
require_once '../core/jwt_helper.php';
require_once '../core/pdf_helper.php';

$database = new Database();
$db = $database->getConnection();
$jwt = new JWTHelper();

$userId = $jwt->validateTokenAndGetUserId();
$role = $jwt->getRole();
if (!$userId) {
    http_response_code(401);
    header("Content-Type: application/json");
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

$orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
if (!$orderId) {
    http_response_code(400);
    header("Content-Type: application/json");
    echo json_encode(["status" => "error", "message" => "order_id required"]);
    exit();
}

$stmt = $db->prepare("SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
                      FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = :id");
$stmt->bindParam(':id', $orderId, PDO::PARAM_INT);
$stmt->execute();
$order = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$order) {
    http_response_code(404);
    header("Content-Type: application/json");
    echo json_encode(["status" => "error", "message" => "Order not found"]);
    exit();
}

// access check: owner, seller of any item, or admin
$isOwner = (int)$order['user_id'] === (int)$userId;
$isSeller = false;
if (!$isOwner && $role !== 'admin') {
    $chk = $db->prepare("SELECT 1 FROM order_items oi
                         JOIN products p ON p.id = oi.product_id
                         JOIN sellers s ON s.id = p.seller_id
                         WHERE oi.order_id = :oid AND s.user_id = :uid LIMIT 1");
    $chk->bindParam(':oid', $orderId, PDO::PARAM_INT);
    $chk->bindParam(':uid', $userId, PDO::PARAM_INT);
    $chk->execute();
    $isSeller = (bool)$chk->fetchColumn();
}
if (!$isOwner && !$isSeller && $role !== 'admin') {
    http_response_code(403);
    header("Content-Type: application/json");
    echo json_encode(["status" => "error", "message" => "Not your order"]);
    exit();
}

$itemsStmt = $db->prepare("SELECT oi.quantity, oi.price, p.name FROM order_items oi
                           LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = :id");
$itemsStmt->bindParam(':id', $orderId, PDO::PARAM_INT);
$itemsStmt->execute();
$items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

// ── Build the PDF ────────────────────────────────────────────────────
$GREEN_R = 0.157; $GREEN_G = 0.227; $GREEN_B = 0.180;
$W = MiniPdf::PAGE_W;
$pdf = new MiniPdf();
$pdf->addPage();

// Header band
$pdf->rect(0, 0, $W, 110, $GREEN_R, $GREEN_G, $GREEN_B);
$pdf->text(40, 42, 24, 'mystore', true, 1, 1, 1);
$pdf->text(40, 70, 10, 'Timeless Essentials & Sustainable Luxury', false, 0.82, 0.88, 0.84);
$pdf->textRight($W - 40, 42, 20, 'INVOICE', true, 1, 1, 1);
$pdf->textRight($W - 40, 68, 10, 'No. INV-' . $order['id'], false, 0.9, 0.93, 0.91);
$pdf->textRight($W - 40, 84, 10, 'Date: ' . date('M d, Y', strtotime($order['created_at'])), false, 0.9, 0.93, 0.91);

// Bill-to
$y = 140;
$pdf->text(40, $y, 9, 'BILL TO', true, 0.55, 0.55, 0.55);
$pdf->text(40, $y + 16, 12, $order['customer_name'] ?? 'Customer', true);
$pdf->text(40, $y + 33, 9.5, ($order['customer_email'] ?? '') . ($order['customer_phone'] ? '  |  ' . $order['customer_phone'] : ''));
$addr = (string)($order['shipping_address'] ?? '');
$pdf->text(40, $y + 49, 9.5, substr($addr, 0, 90));

// Order meta on the right
$pdf->textRight($W - 40, $y, 9, 'ORDER #' . $order['id'], true, 0.55, 0.55, 0.55);
$pdf->textRight($W - 40, $y + 16, 9.5, 'Payment: ' . ($order['payment_method'] ?? '-'));
$pdf->textRight($W - 40, $y + 32, 9.5, 'Status: ' . ucfirst($order['order_status'] ?? ''));

// Items table
$y = 240;
$pdf->rect(40, $y - 6, $W - 80, 22, 0.94, 0.95, 0.94);
$pdf->text(48, $y + 9, 9, 'ITEM', true, 0.35, 0.4, 0.37);
$pdf->textRight($W - 170, $y + 9, 9, 'QTY', true, 0.35, 0.4, 0.37);
$pdf->textRight($W - 105, $y + 9, 9, 'UNIT', true, 0.35, 0.4, 0.37);
$pdf->textRight($W - 48, $y + 9, 9, 'TOTAL', true, 0.35, 0.4, 0.37);
$y += 30;

$subtotal = 0;
foreach ($items as $it) {
    $qty = (int)$it['quantity'];
    $price = (float)$it['price'];
    $line = $qty * $price;
    $subtotal += $line;
    $pdf->text(48, $y, 10, substr($it['name'] ?? 'Item', 0, 52));
    $pdf->textRight($W - 170, $y, 10, (string)$qty);
    $pdf->textRight($W - 105, $y, 10, number_format($price, 2));
    $pdf->textRight($W - 48, $y, 10, number_format($line, 2), true);
    $y += 20;
    $pdf->line(48, $y - 8, $W - 48, $y - 8, 0.4, 0.9, 0.9, 0.9);
}
$y += 6;

// Totals
$discount = (float)($order['discount_amount'] ?? 0);
$total = (float)$order['total_amount'];
$pdf->textRight($W - 105, $y, 10, 'Subtotal');
$pdf->textRight($W - 48, $y, 10, number_format($subtotal, 2));
$y += 18;
if ($discount > 0) {
    $pdf->textRight($W - 105, $y, 10, 'Discount');
    $pdf->textRight($W - 48, $y, 10, '-' . number_format($discount, 2));
    $y += 18;
}
$pdf->rect($W - 260, $y - 12, 220, 26, $GREEN_R, $GREEN_G, $GREEN_B);
$pdf->textRight($W - 105, $y + 5, 11, 'GRAND TOTAL', true, 1, 1, 1);
$pdf->textRight($W - 48, $y + 5, 12, 'Rs. ' . number_format($total, 2), true, 1, 1, 1);
$y += 44;

// TCS shipping block — the CN the customer can track
if (!empty($order['tcs_cn'])) {
    $pdf->rect(40, $y, $W - 80, 74, 0.96, 0.97, 0.96);
    $pdf->text(52, $y + 20, 9, 'SHIPPING — TCS COURIER', true, 0.35, 0.42, 0.38);
    $pdf->text(52, $y + 40, 14, 'TCS Tracking No: ' . $order['tcs_cn'], true, $GREEN_R, $GREEN_G, $GREEN_B);
    $statusText = $order['tcs_status'] ?? 'Booked';
    $codLine = (stripos((string)$order['payment_method'], 'cod') === 0 || stripos((string)$order['payment_method'], 'cash') !== false)
        ? '  |  COD: Rs. ' . number_format($total, 2) . ' (' . ucfirst($order['cod_paid_status'] ?? 'unpaid') . ')'
        : '';
    $pdf->text(52, $y + 58, 9.5, 'Status: ' . $statusText . $codLine);
    $y += 92;
} else {
    $pdf->text(40, $y + 8, 9.5, 'Shipping: not yet dispatched', false, 0.55, 0.55, 0.55);
    $y += 30;
}

// Footer
$pdf->line(40, MiniPdf::PAGE_H - 70, $W - 40, MiniPdf::PAGE_H - 70, 0.5, 0.85, 0.85, 0.85);
$pdf->text(40, MiniPdf::PAGE_H - 54, 9, 'Thank you for shopping with mystore.', true, 0.35, 0.4, 0.37);
$pdf->text(40, MiniPdf::PAGE_H - 40, 8, 'Generated ' . date('M d, Y H:i') . '  |  Keep this invoice for your records and returns.');

$pdfBytes = $pdf->output();

// cache a copy
$dir = '../uploads/invoices';
if (!is_dir($dir)) @mkdir($dir, 0777, true);
@file_put_contents($dir . '/invoice_' . $orderId . '.pdf', $pdfBytes);

header("Content-Type: application/pdf");
header("Content-Disposition: inline; filename=\"Invoice_INV-" . $orderId . ".pdf\"");
header("Content-Length: " . strlen($pdfBytes));
echo $pdfBytes;
?>
