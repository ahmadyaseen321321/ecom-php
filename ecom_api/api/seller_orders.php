<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../core/database.php';
require_once '../core/jwt_helper.php';
require_once '../core/fcm_helper.php';


$database = new Database();
$db = $database->getConnection();
$jwtHelper = new JWTHelper();

$userId = $jwtHelper->validateTokenAndGetUserId();
if (!$userId) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

$role = $jwtHelper->getRole();
if ($role !== 'seller' && $role !== 'admin') {
     http_response_code(403);
     echo json_encode(["status" => "error", "message" => "Forbidden: Seller or Admin role required"]);
     exit();
}

// Get the seller ID
$sellerQuery = "SELECT id FROM sellers WHERE user_id = :user_id";
$sellerStmt = $db->prepare($sellerQuery);
$sellerStmt->bindParam(':user_id', $userId);
$sellerStmt->execute();
$seller = $sellerStmt->fetch(PDO::FETCH_ASSOC);

if (!$seller && $role === 'admin') {
    $seller = $db->query("SELECT id FROM sellers LIMIT 1")->fetch(PDO::FETCH_ASSOC);
}

if (!$seller) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode(["status" => "success", "data" => []]);
        exit();
    }
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Seller profile not found"]);
    exit();
}
$sellerId = $seller['id'];

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // If admin, or if seller has products, fetch accordingly
    if ($role === 'admin' && empty($sellerId)) {
        $query = "SELECT DISTINCT o.id, o.order_status as status, o.created_at, o.shipping_address, o.payment_method, o.payment_status, u.full_name as customer_name, u.phone as customer_phone
                  FROM orders o
                  JOIN users u ON o.user_id = u.id
                  ORDER BY o.created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Fetch unique orders that contain at least one product from this seller
        $query = "SELECT DISTINCT o.id, o.order_status as status, o.created_at, o.shipping_address, o.payment_method, o.payment_status, u.full_name as customer_name, u.phone as customer_phone
                  FROM orders o
                  JOIN users u ON o.user_id = u.id
                  JOIN order_items oi ON o.id = oi.order_id
                  JOIN products p ON oi.product_id = p.id
                  WHERE p.seller_id = :seller_id
                  ORDER BY o.created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':seller_id', $sellerId);
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fallback for admin if seller has no orders yet
        if (empty($orders) && $role === 'admin') {
            $query = "SELECT DISTINCT o.id, o.order_status as status, o.created_at, o.shipping_address, o.payment_method, o.payment_status, u.full_name as customer_name, u.phone as customer_phone
                      FROM orders o
                      JOIN users u ON o.user_id = u.id
                      ORDER BY o.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }

    $result = [];
    foreach ($orders as $order) {
        $itemQuery = "SELECT oi.id, oi.quantity, oi.price, p.name, p.id as product_id, pi.image_url as main_image
                      FROM order_items oi
                      JOIN products p ON oi.product_id = p.id
                      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
                      WHERE oi.order_id = :order_id";
        $params = [':order_id' => $order['id']];
        if ($role !== 'admin' && !empty($sellerId)) {
            $itemQuery .= " AND p.seller_id = :seller_id";
            $params[':seller_id'] = $sellerId;
        }

        $itemStmt = $db->prepare($itemQuery);
        $itemStmt->execute($params);
        $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

        $orderTotal = 0;
        $itemCount = 0;
        foreach ($items as $item) {
            $orderTotal += ($item['price'] * $item['quantity']);
            $itemCount += $item['quantity'];
        }

        $result[] = [
            "id" => $order['id'],
            "customerName" => $order['customer_name'],
            "customer_name" => $order['customer_name'],
            "customer_phone" => $order['customer_phone'],
            "shipping_address" => $order['shipping_address'],
            "payment_method" => $order['payment_method'],
            "payment_status" => $order['payment_status'],
            "status" => strtolower($order['status']),
            "order_status" => $order['status'],
            "date" => $order['created_at'],
            "created_at" => $order['created_at'],
            "total" => $orderTotal,
            "total_amount" => $orderTotal,
            "itemCount" => $itemCount,
            "cancellation_reason" => isset($order['cancellation_reason']) ? $order['cancellation_reason'] : null,
            "items" => $items
        ];

    }
    echo json_encode(["status" => "success", "data" => $result]);
    exit();
} elseif ($method === 'PUT') {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (!isset($data['order_id']) || !isset($data['status'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "order_id and status are required"]);
        exit();
    }

    $orderId = $data['order_id'];
    $newStatus = strtoupper($data['status']);
    $reason = $data['reason'] ?? null;

    // Verify ownership and get customer info for notification
    $verifyQuery = "SELECT o.user_id as customer_id FROM order_items oi 
                    JOIN products p ON oi.product_id = p.id 
                    JOIN orders o ON oi.order_id = o.id
                    WHERE oi.order_id = :order_id AND p.seller_id = :seller_id";
    $verifyStmt = $db->prepare($verifyQuery);
    $verifyStmt->bindParam(':order_id', $orderId);
    $verifyStmt->bindParam(':seller_id', $sellerId);
    $verifyStmt->execute();
    $orderData = $verifyStmt->fetch(PDO::FETCH_ASSOC);

    if (!$orderData) {
         http_response_code(403);
         echo json_encode(["status" => "error", "message" => "Forbidden: You do not have products in this order"]);
         exit();
    }
    $customerId = $orderData['customer_id'];

    $updateQuery = "UPDATE orders SET order_status = :status";
    if ($newStatus === 'CANCELLED' && $reason !== null) {
        $updateQuery .= ", cancellation_reason = :reason";
    }
    $updateQuery .= " WHERE id = :order_id";
    
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':status', $newStatus);
    $updateStmt->bindParam(':order_id', $orderId);
    if ($newStatus === 'CANCELLED' && $reason !== null) {
        $updateStmt->bindParam(':reason', $reason);
    }

    if ($updateStmt->execute()) {
         // Notifications Section
         $fcm = new FCMHelper();
         
         if ($newStatus === 'CANCELLED') {
             // 1. Notify Customer
             $customerQuery = "SELECT fcm_token FROM users WHERE id = :customer_id";
             $cStmt = $db->prepare($customerQuery);
             $cStmt->bindParam(':customer_id', $customerId);
             $cStmt->execute();
             $customerToken = $cStmt->fetchColumn();

             $customerMsg = "Your order #$orderId has been cancelled by the seller.";
             if ($reason) $customerMsg .= " Reason: $reason";
             
             if ($customerToken) {
                 $fcm->sendNotification(
                     $customerToken, 
                     "Order #$orderId Cancelled", 
                     $customerMsg, 
                     ["order_id" => $orderId, "type" => "order_details"]
                 );
             }
             $fcm->saveToHistory($db, $customerId, "Order #$orderId Cancelled", $customerMsg, "order_details");

             // 2. Notify Seller (Confirmation)
             $sellerUserQuery = "SELECT fcm_token FROM users WHERE id = :user_id";
             $suStmt = $db->prepare($sellerUserQuery);
             $suStmt->bindParam(':user_id', $userId);
             $suStmt->execute();
             $sellerToken = $suStmt->fetchColumn();

             $sellerMsg = "You have cancelled order #$orderId.";
             if ($sellerToken) {
                 $fcm->sendNotification(
                     $sellerToken, 
                     "Order #$orderId Cancelled", 
                     $sellerMsg, 
                     ["order_id" => $orderId, "type" => "seller_orders"]
                 );
             }
             $fcm->saveToHistory($db, $userId, "Order #$orderId Cancelled", $sellerMsg, "seller_orders");
         } else {
             // Notify Customer of status update
             $customerQuery = "SELECT fcm_token FROM users WHERE id = :customer_id";
             $cStmt = $db->prepare($customerQuery);
             $cStmt->bindParam(':customer_id', $customerId);
             $cStmt->execute();
             $customerToken = $cStmt->fetchColumn();

             $statusMsg = "Your order #$orderId status has been updated to $newStatus.";
             if ($customerToken) {
                 $fcm->sendNotification($customerToken, "Order Update", $statusMsg, ["order_id" => $orderId, "type" => "order_details"]);
             }
             $fcm->saveToHistory($db, $customerId, "Order Update", $statusMsg, "order_details");
         }

         echo json_encode(["status" => "success", "message" => "Order updated successfully"]);
    } else {
         echo json_encode(["status" => "error", "message" => "Failed to update order status"]);
    }
    exit();


} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
