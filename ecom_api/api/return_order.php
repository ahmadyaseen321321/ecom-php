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

        // 2. Check if return is allowed (only for delivered/completed)
        $allowedStatuses = ['delivered', 'completed'];
        if (!in_array(strtolower($order['order_status']), $allowedStatuses)) {
            echo json_encode(["status" => "error", "message" => "Order cannot be returned as it's " . $order['order_status']]);
            exit();
        }

        // 3. Update order status to return requested
        $updateQuery = "UPDATE orders SET order_status = 'return requested', cancellation_reason = :reason WHERE id = :order_id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':order_id', $orderId);
        $updateStmt->bindParam(':reason', $reason);
        
        if ($updateStmt->execute()) {
            // 4. Send Notifications
            
            // Notification for Sellers
            $seller_query = "SELECT DISTINCT u.fcm_token, s.user_id as seller_user_id
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
                    $title = "Return Requested 🔄";
                    $body = "A return for order #$orderId has been requested by {$order['customer_name']}. Reason: $reason";
                    $fcm->sendNotification($seller['fcm_token'], $title, $body, ["order_id" => $orderId, "type" => "seller_orders"]);
                    $fcm->saveToHistory($db, $seller['seller_user_id'], $title, $body, "return_requested");
                }
            }

            echo json_encode(["status" => "success", "message" => "Return request submitted successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to update order status"]);
        }

    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Server Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Incomplete request"]);
}
?>
