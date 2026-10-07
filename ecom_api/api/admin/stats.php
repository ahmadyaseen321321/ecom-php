<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

require_once '../../core/database.php';
require_once '../../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();
$jwtHelper = new JWTHelper();

$userId = $jwtHelper->validateTokenAndGetUserId();
$role = $jwtHelper->getRole();

if (!$userId || $role !== 'admin') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Admin access required"]);
    exit();
}

// Total Users
$stmt = $db->query("SELECT COUNT(*) as total_users FROM users");
$totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total_users'];

// Total Orders
$stmt = $db->query("SELECT COUNT(*) as total_orders FROM orders");
$totalOrders = $stmt->fetch(PDO::FETCH_ASSOC)['total_orders'];

// Total Revenue
$stmt = $db->query("SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM orders WHERE order_status = 'delivered'");
$totalRevenue = $stmt->fetch(PDO::FETCH_ASSOC)['total_revenue'];

// Avg Order Value
$avgOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0;

// Total Products
$stmt = $db->query("SELECT COUNT(*) as total_products FROM products");
$totalProducts = $stmt->fetch(PDO::FETCH_ASSOC)['total_products'];

// Total Sellers
$stmt = $db->query("SELECT COUNT(*) as total_sellers FROM sellers");
$totalSellers = $stmt->fetch(PDO::FETCH_ASSOC)['total_sellers'];

// Order Status Breakdown
$stmt = $db->query("SELECT 
    SUM(CASE WHEN LOWER(order_status) = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN LOWER(order_status) IN ('shipped', 'shipping') THEN 1 ELSE 0 END) as shipped,
    SUM(CASE WHEN LOWER(order_status) = 'delivered' THEN 1 ELSE 0 END) as delivered,
    SUM(CASE WHEN LOWER(order_status) = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
    SUM(CASE WHEN LOWER(order_status) IN ('processing', 'confirmed') THEN 1 ELSE 0 END) as processing
    FROM orders");
$statusBreakdown = $stmt->fetch(PDO::FETCH_ASSOC);

// Lifetime Value
$lifetimeValue = $totalUsers > 0 ? round($totalRevenue / $totalUsers, 2) : 0;

echo json_encode([
    "status" => "success",
    "data" => [
        "total_users" => (int)$totalUsers,
        "total_orders" => (int)$totalOrders,
        "total_revenue" => round((float)$totalRevenue, 2),
        "avg_order_value" => $avgOrderValue,
        "lifetime_value" => $lifetimeValue,
        "total_products" => (int)$totalProducts,
        "total_sellers" => (int)$totalSellers,
        "order_status" => $statusBreakdown
    ]
]);
?>
