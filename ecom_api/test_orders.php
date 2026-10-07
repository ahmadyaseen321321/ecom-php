<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once 'core/database.php';

$database = new Database();
$db = $database->getConnection();

// Get recent orders with items
$stmt = $db->prepare("SELECT o.id, o.user_id, o.total_amount, o.shipping_address, o.order_status, o.created_at FROM orders ORDER BY o.id DESC LIMIT 3");
$stmt->execute();
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($orders as &$order) {
    $item_stmt = $db->prepare("SELECT oi.quantity, oi.price, oi.product_id, p.name, pi.image_url as main_image
                                FROM order_items oi
                                JOIN products p ON oi.product_id = p.id
                                LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
                                WHERE oi.order_id = :order_id");
    $item_stmt->execute([':order_id' => $order['id']]);
    $order['items'] = $item_stmt->fetchAll(PDO::FETCH_ASSOC);
}

echo json_encode($orders, JSON_PRETTY_PRINT);
?>
