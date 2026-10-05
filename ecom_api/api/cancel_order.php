<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../core/database.php';
require_once '../core/jwt_helper.php';
require_once '../core/fcm_helper.php';

$database = new Database();
$db = $database->getConnection();
$jwtHelper = new JWTHelper();
$fcm = new FCMHelper();

$userId = $jwtHelper->validateTokenAndGetUserId();

if (!$userId) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->order_id) && !empty($data->reason)) {
    try {
        $orderId = $data->order_id;
        $reason = $data->reason;

        // 1. Fetch current order status and user name
        $query = "SELECT o.order_status, u.full_name as customer_name 
                  FROM orders o 
                  JOIN users u ON o.user_id = u.id 
                  WHERE o.id = :order_id AND o.user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':order_id', $orderId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            echo json_encode(["status" => "error", "message" => "Order not found or access denied"]);
            exit();
        }

        // 2. Check if cancellation is allowed (not confirmed, shipped, etc.)
        $allowedStatuses = ['pending', 'processing'];
        if (!in_array($order['order_status'], $allowedStatuses)) {
            echo json_encode(["status" => "error", "message" => "Order cannot be cancelled as it's already " . $order['order_status']]);
            exit();
        }

        // 3. Update order status to cancelled
        $updateQuery = "UPDATE orders SET order_status = 'cancelled', cancellation_reason = :reason WHERE id = :order_id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':order_id', $orderId);
        $updateStmt->bindParam(':reason', $reason);
        
        if ($updateStmt->execute()) {
            // 4. Send Notifications
            
            // Notification for User
            $user_query = "SELECT fcm_token FROM users WHERE id = :user_id";
            $u_stmt = $db->prepare($user_query);
            $u_stmt->bindParam(':user_id', $userId);
            $u_stmt->execute();
            $user_fcm = $u_stmt->fetchColumn();
            
            if ($user_fcm) {
                $fcm->sendNotification(
                    $user_fcm, 
                    "Order Cancelled", 
                    "your order #$orderId has been canceled", 
                    ["order_id" => $orderId, "type" => "order_cancelled"]
                );
            }

            // Notification for Sellers
            $seller_query = "SELECT DISTINCT u.fcm_token 
                            FROM order_items oi 
                            JOIN products p ON oi.product_id = p.id 
                            JOIN sellers s ON p.seller_id = s.id 
                            JOIN users u ON s.user_id = u.id 
                            WHERE oi.order_id = :order_id";
            $s_stmt = $db->prepare($seller_query);
            $s_stmt->bindParam(':order_id', $orderId);
            $s_stmt->execute();
            $sellers = $s_stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($sellers as $seller) {
                if ($seller['fcm_token']) {
                    $fcm->sendNotification(
                        $seller['fcm_token'], 
                        "Order Cancelled by User", 
                        "order #$orderId has been cancelled by user {$order['customer_name']}", 
                        ["order_id" => $orderId, "type" => "seller_orders"]
                    );
                }
            }

            echo json_encode(["status" => "success", "message" => "Order cancelled successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to update order status"]);
        }

    } catch (Exception $e) {
        $message = $e->getMessage();
        if (strpos($message, 'cancellation_reason') !== false) {
            $message = "Database error: THE 'cancellation_reason' COLUMN IS MISSING. Please run this SQL: ALTER TABLE orders ADD cancellation_reason TEXT DEFAULT NULL AFTER order_status;";
        }
        echo json_encode(["status" => "error", "message" => $message]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Incomplete request"]);
}

?>
