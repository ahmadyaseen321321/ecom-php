<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();

// Ensure Table Exists
$tableQuery = "CREATE TABLE IF NOT EXISTS user_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    street TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)";
$db->exec($tableQuery);

$userId = JWTHelper::validateTokenAndGetUserId();

if (!$userId) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $query = "SELECT * FROM user_addresses WHERE user_id = :user_id ORDER BY is_default DESC, created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    $addresses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $addresses]);

} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if ($data && !empty($data->full_name) && !empty($data->street)) {
        // If this is set as default, unset other defaults for this user
        if (!empty($data->is_default) && $data->is_default == 1) {
            $updateDefault = "UPDATE user_addresses SET is_default = 0 WHERE user_id = :user_id";
            $uStmt = $db->prepare($updateDefault);
            $uStmt->bindParam(':user_id', $userId);
            $uStmt->execute();
        }

        $query = "INSERT INTO user_addresses (user_id, full_name, phone, street, city, state, zip_code, is_default) 
                  VALUES (:user_id, :full_name, :phone, :street, :city, :state, :zip_code, :is_default)";
        $stmt = $db->prepare($query);
        
        $isDef = !empty($data->is_default) ? 1 : 0;
        
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':full_name', $data->full_name);
        $stmt->bindParam(':phone', $data->phone);
        $stmt->bindParam(':street', $data->street);
        $stmt->bindParam(':city', $data->city);
        $stmt->bindParam(':state', $data->state);
        $stmt->bindParam(':zip_code', $data->zip_code);
        $stmt->bindParam(':is_default', $isDef);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Address added successfully", "id" => $db->lastInsertId()]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to add address"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Incomplete data or invalid JSON"]);
    }

} elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    
    if ($data && !empty($data->id)) {
        // Ownership check
        $check = "SELECT id FROM user_addresses WHERE id = :id AND user_id = :user_id";
        $cStmt = $db->prepare($check);
        $cStmt->bindParam(':id', $data->id);
        $cStmt->bindParam(':user_id', $userId);
        $cStmt->execute();
        
        if ($cStmt->rowCount() == 0) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Access denied"]);
            exit();
        }

        if (!empty($data->is_default) && $data->is_default == 1) {
            $updateDefault = "UPDATE user_addresses SET is_default = 0 WHERE user_id = :user_id";
            $uStmt = $db->prepare($updateDefault);
            $uStmt->bindParam(':user_id', $userId);
            $uStmt->execute();
        }

        $query = "UPDATE user_addresses SET 
                  full_name = :full_name, phone = :phone, street = :street, 
                  city = :city, state = :state, zip_code = :zip_code, is_default = :is_default
                  WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        
        $isDef = !empty($data->is_default) ? 1 : 0;
        
        $stmt->bindParam(':full_name', $data->full_name);
        $stmt->bindParam(':phone', $data->phone);
        $stmt->bindParam(':street', $data->street);
        $stmt->bindParam(':city', $data->city);
        $stmt->bindParam(':state', $data->state);
        $stmt->bindParam(':zip_code', $data->zip_code);
        $stmt->bindParam(':is_default', $isDef);
        $stmt->bindParam(':id', $data->id);
        $stmt->bindParam(':user_id', $userId);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Address updated successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to update address"]);
        }
    }

} elseif ($method == 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    if ($id) {
        $query = "DELETE FROM user_addresses WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $userId);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Address deleted successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to delete address"]);
        }
    }
}
?>
