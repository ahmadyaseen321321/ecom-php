<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();

// Schema repair logic (Ensures the table and columns exist)
try {
    $db->exec("CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'promo',
        is_global TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Add missing columns if table existed from an older version
    $columns = $db->query("SHOW COLUMNS FROM notifications")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('type', $columns)) {
        $db->exec("ALTER TABLE notifications ADD COLUMN type VARCHAR(50) DEFAULT 'promo' AFTER message");
    }

    // Ensure users table has fcm_token column
    $userColumns = $db->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('fcm_token', $userColumns)) {
        $db->exec("ALTER TABLE users ADD COLUMN fcm_token TEXT NULL");
    }
} catch (Exception $e) {
    // Silence errors
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $query = "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "status" => "success",
        "data" => $notifications
    ]);
} elseif ($method == 'POST') {
    $inputStr = file_get_contents("php://input");
    $data = json_decode($inputStr);
    $input = json_decode($inputStr, true);

    // Handle FCM Token update
    if (isset($input['fcm_token']) && isset($input['user_id'])) {
        $query = "UPDATE users SET fcm_token = ? WHERE id = ?";
        $stmt = $db->prepare($query);
        if ($stmt->execute([$input['fcm_token'], $input['user_id']])) {
            echo json_encode(["status" => "success", "message" => "FCM Token updated"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to update token"]);
        }
        exit();
    }

    // Only Admin can post promotional notifications
    $userId = JWTHelper::validateTokenAndGetUserId();
    $role = JWTHelper::getRole();
    
    if (!$userId || $role !== 'admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Only admins can send broadcasts"]);
        exit();
    }
    
    if (!empty($data->title) && !empty($data->message)) {
        $query = "INSERT INTO notifications (title, message, type) VALUES (:title, :message, :type)";
        $stmt = $db->prepare($query);
        
        $type = $data->type ?? 'promo';
        $stmt->bindParam(':title', $data->title);
        $stmt->bindParam(':message', $data->message);
        $stmt->bindParam(':type', $type);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Notification broadcasted"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to broadcast"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Title and message are required"]);
    }
}
?>
