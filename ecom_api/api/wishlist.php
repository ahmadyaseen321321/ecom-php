<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();
$jwtHelper = new JWTHelper();

$userId = $jwtHelper->validateTokenAndGetUserId();

if (!$userId) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    // Modified query to fetch all required fields for ProductModel.fromJson
    $query = "SELECT p.*, pi.image_url as main_image, 
              IFNULL((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), 0.0) as rating
              FROM wishlist w 
              JOIN products p ON w.product_id = p.id 
              LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = 1
              WHERE w.user_id = :user_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    $wishlistItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("WISHLIST_DEBUG: Fetched " . count($wishlistItems) . " items for user $userId");
    
    echo json_encode([
        "status" => "success",
        "data" => $wishlistItems
    ]);
} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    error_log("WISHLIST_DEBUG: POST Request - User: $userId, Product: " . ($data->product_id ?? 'null'));
    
    if (!empty($data->product_id)) {
        $query = "INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (:user_id, :product_id)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':product_id', $data->product_id);
        
        if ($stmt->execute()) {
            error_log("WISHLIST_DEBUG: Successfully added/ignored product " . $data->product_id);
            echo json_encode(["status" => "success", "message" => "Wishlist updated"]);
        } else {
            error_log("WISHLIST_DEBUG: Failed to execute INSERT for product " . $data->product_id);
            echo json_encode(["status" => "error", "message" => "Failed to update wishlist"]);
        }
    } else {
        error_log("WISHLIST_DEBUG: POST Request missing product_id");
        echo json_encode(["status" => "error", "message" => "Product ID is required"]);
    }
} elseif ($method == 'DELETE') {
    $product_id = isset($_GET['product_id']) ? $_GET['product_id'] : null;
    error_log("WISHLIST_DEBUG: DELETE Request - User: $userId, Product: $product_id");
    
    if ($product_id) {
        $query = "DELETE FROM wishlist WHERE user_id = :user_id AND product_id = :product_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':product_id', $product_id);
        
        if ($stmt->execute()) {
            error_log("WISHLIST_DEBUG: Successfully removed product $product_id");
            echo json_encode(["status" => "success", "message" => "Item removed from wishlist"]);
        } else {
            error_log("WISHLIST_DEBUG: Failed to execute DELETE for product $product_id");
            echo json_encode(["status" => "error", "message" => "Failed to remove item"]);
        }
    } else {
        error_log("WISHLIST_DEBUG: DELETE Request missing product_id");
        echo json_encode(["status" => "error", "message" => "Product ID is required"]);
    }
}
?>
