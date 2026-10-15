<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once 'core/database.php';

$database = new Database();
$db = $database->getConnection();

$stmt = $db->query("UPDATE orders SET order_status = 'pending' WHERE order_status = '' OR order_status IS NULL");
$affected = $stmt->rowCount();

$stmt2 = $db->query("SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status");
$breakdown = $stmt2->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["updated_blank_orders" => $affected, "current_breakdown" => $breakdown], JSON_PRETTY_PRINT);
exit();

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
