<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();
$jwtHelper = new JWTHelper();

// Read body ONCE — php://input can only be read once
$rawBody = file_get_contents("php://input");
$data = json_decode($rawBody);

// --- Auth: try header first, then body fallback ---
$userId = $jwtHelper->validateTokenAndGetUserId();

if (!$userId && isset($data->token)) {
    $decoded = $jwtHelper->validate($data->token);
    if ($decoded && isset($decoded['id'])) {
        $userId = (int) $decoded['id'];
    }
}
// --- End Auth ---

if (!$userId) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    // Fetch notification history
    try {
        $query = "SELECT id, title, message, type, is_read, created_at 
                  FROM notifications 
                  WHERE user_id = :user_id AND is_read = false
                  ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "status" => "success",
            "data" => $history
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} 
elseif ($method == 'POST') {
    // $data already parsed globally above
    
    if (isset($data->fcm_token)) {
        // Update FCM Token for the user
        try {
            $query = "UPDATE users SET fcm_token = :fcm_token WHERE id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':fcm_token', $data->fcm_token);
            $stmt->bindParam(':user_id', $userId);
            
            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "FCM Token updated successfully"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Failed to update FCM Token"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } 
    elseif (isset($data->mark_read)) {
        // Mark notification as read
        try {
            $query = "UPDATE notifications SET is_read = true WHERE id = :id AND user_id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $data->id);
            $stmt->bindParam(':user_id', $userId);
            
            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Notification marked as read"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Failed to update status"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }
    else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid request body"]);
    }
}
?>
