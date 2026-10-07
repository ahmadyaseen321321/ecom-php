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
    $statusFilter = isset($_GET['status']) ? trim($_GET['status']) : '';
    
    $query = "SELECT 
                o.id,
                o.user_id,
                o.total_amount,
                o.discount_amount,
                o.shipping_address,
                o.payment_method,
                o.payment_status,
                o.order_status,
                o.created_at,
                u.full_name as user_name,
                u.email as user_email
              FROM orders o
              LEFT JOIN users u ON o.user_id = u.id";
    
    $params = [];
    if (!empty($statusFilter) && strtolower($statusFilter) !== 'all') {
        $query .= " WHERE LOWER(o.order_status) = LOWER(:status)";
        $params[':status'] = $statusFilter;
    }
    
    $query .= " ORDER BY o.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $result = [];
    foreach ($orders as $order) {
        // Fetch first product in order for preview
        $itemStmt = $db->prepare("SELECT oi.quantity, oi.price, p.name as product_name, 
                                  (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image,
                                  (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as any_image
                                  FROM order_items oi
                                  LEFT JOIN products p ON oi.product_id = p.id
                                  WHERE oi.order_id = :order_id
                                  LIMIT 1");
        $itemStmt->execute([':order_id' => $order['id']]);
        $item = $itemStmt->fetch(PDO::FETCH_ASSOC);
        
        $productName = $item ? $item['product_name'] : 'Order #' . $order['id'];
        $productImg = $item ? ($item['main_image'] ?: $item['any_image']) : null;
        
        $result[] = [
            "id" => "#ORD-" . $order['id'],
            "raw_id" => (int)$order['id'],
            "user_name" => $order['user_name'],
            "user_email" => $order['user_email'],
            "product" => $productName,
            "product_name" => $productName,
            "product_img" => $productImg,
            "date" => date('M j, Y', strtotime($order['created_at'])),
            "created_at" => $order['created_at'],
            "price" => "$" . number_format((float)$order['total_amount'], 2),
            "total_price" => (float)$order['total_amount'],
            "payment" => ucfirst($order['payment_method']),
            "payment_method" => $order['payment_method'],
            "payment_status" => $order['payment_status'],
            "status" => ucfirst($order['order_status'])
        ];
    }
    
    echo json_encode($result);
    exit();
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $orderId = isset($data['order_id']) ? $data['order_id'] : (isset($_GET['id']) ? $_GET['id'] : null);
    $status = isset($data['status']) ? strtolower(trim($data['status'])) : null;
    
    if (!$orderId || !$status) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Order ID and status are required"]);
        exit();
    }
    
    // Clean "#ORD-" prefix if passed
    $cleanId = is_string($orderId) ? preg_replace('/[^0-9]/', '', $orderId) : $orderId;
    
    $stmt = $db->prepare("UPDATE orders SET order_status = :status WHERE id = :id");
    if ($stmt->execute([':status' => $status, ':id' => $cleanId])) {
        echo json_encode(["status" => "success", "message" => "Order status updated successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to update order status"]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
?>
