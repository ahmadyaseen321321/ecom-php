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
$tableQuery = "CREATE TABLE IF NOT EXISTS user_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    cardholder_name VARCHAR(255) NOT NULL,
    card_number VARCHAR(255) NOT NULL,
    expiry_date VARCHAR(10) NOT NULL,
    cvv VARCHAR(10) NOT NULL,
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
    $query = "SELECT id, user_id, cardholder_name, 
              CONCAT('•••• •••• •••• ', RIGHT(card_number, 4)) as card_number_masked,
              RIGHT(card_number, 4) as last4,
              expiry_date, is_default 
              FROM user_cards WHERE user_id = :user_id ORDER BY is_default DESC, created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $cards]);

} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if ($data && !empty($data->card_number) && !empty($data->cardholder_name)) {
        // If this is set as default, unset other defaults for this user
        if (!empty($data->is_default) && $data->is_default == 1) {
            $updateDefault = "UPDATE user_cards SET is_default = 0 WHERE user_id = :user_id";
            $uStmt = $db->prepare($updateDefault);
            $uStmt->bindParam(':user_id', $userId);
            $uStmt->execute();
        }

        $query = "INSERT INTO user_cards (user_id, cardholder_name, card_number, expiry_date, cvv, is_default) 
                  VALUES (:user_id, :cardholder_name, :card_number, :expiry_date, :cvv, :is_default)";
        $stmt = $db->prepare($query);
        
        $isDef = !empty($data->is_default) ? 1 : 0;
        
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':cardholder_name', $data->cardholder_name);
        $stmt->bindParam(':card_number', $data->card_number);
        $stmt->bindParam(':expiry_date', $data->expiry_date);
        $stmt->bindParam(':cvv', $data->cvv);
        $stmt->bindParam(':is_default', $isDef);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Card added successfully", "id" => $db->lastInsertId()]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to add card"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Incomplete card data"]);
    }

} elseif ($method == 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    if ($id) {
        $query = "DELETE FROM user_cards WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $userId);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Card deleted successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to delete card"]);
        }
    }
}
?>
