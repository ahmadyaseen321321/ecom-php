<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PUT, OPTIONS");
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

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $query = "SELECT 
                s.id,
                s.user_id,
                s.shop_name,
                s.shop_logo,
                s.shop_description,
                s.verification_status,
                s.performance_score,
                s.commission_rate,
                u.full_name,
                u.email,
                u.phone,
                u.created_at as joined_at,
                (SELECT COUNT(DISTINCT oi.order_id) 
                 FROM order_items oi 
                 JOIN products p ON oi.product_id = p.id 
                 WHERE p.seller_id = s.id) as total_orders,
                (SELECT COALESCE(SUM(oi.price * oi.quantity), 0) 
                 FROM order_items oi 
                 JOIN products p ON oi.product_id = p.id 
                 JOIN orders o ON oi.order_id = o.id
                 WHERE p.seller_id = s.id AND o.order_status = 'delivered') as total_revenue
              FROM sellers s
              LEFT JOIN users u ON s.user_id = u.id
              ORDER BY s.id DESC";
              
    $stmt = $db->query($query);
    $sellers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $result = [];
    foreach ($sellers as $s) {
        $result[] = [
            "id" => (int)$s['id'],
            "user_id" => (int)$s['user_id'],
            "name" => $s['full_name'] ?: 'Unknown',
            "email" => $s['email'] ?: 'No email',
            "store" => $s['shop_name'] ?: 'My Store',
            "shop_name" => $s['shop_name'],
            "shop_logo" => $s['shop_logo'],
            "shop_description" => $s['shop_description'],
            "orders" => (int)$s['total_orders'],
            "revenue" => "$" . number_format((float)$s['total_revenue'], 2),
            "raw_revenue" => (float)$s['total_revenue'],
            "status" => $s['verification_status'],
            "verification_status" => $s['verification_status'],
            "performance_score" => (float)$s['performance_score'],
            "commission_rate" => (float)$s['commission_rate']
        ];
    }
    
    echo json_encode($result);
    exit();
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $sellerId = isset($data['seller_id']) ? $data['seller_id'] : null;
    $status = isset($data['status']) ? strtolower(trim($data['status'])) : null;
    
    if (!$sellerId || !$status) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Seller ID and status are required"]);
        exit();
    }
    
    $allowedStatuses = ['pending', 'approved', 'rejected'];
    if (!in_array($status, $allowedStatuses)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid verification status"]);
        exit();
    }
    
    $stmt = $db->prepare("UPDATE sellers SET verification_status = :status WHERE id = :id");
    if ($stmt->execute([':status' => $status, ':id' => $sellerId])) {
        echo json_encode(["status" => "success", "message" => "Seller status updated to $status"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to update seller status"]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
?>
