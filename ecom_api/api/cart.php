<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../core/database.php';
// JWT no longer required for cart – user_id is sent directly

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = null;

if ($method == 'GET' || $method == 'DELETE') {
    $userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;
} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $userId = (isset($data) && isset($data->user_id)) ? $data->user_id : null;
}

if (!$userId) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit();
}

if ($method == 'GET') {
    $query = "SELECT c.id AS cart_id, c.quantity,
              p.id AS product_id, p.category_id, p.name, p.description, p.price, p.discount_price, p.stock,
              (SELECT pi.image_url FROM product_images pi
               WHERE pi.product_id = p.id
               ORDER BY pi.is_main DESC, pi.id ASC LIMIT 1) AS main_image
              FROM cart c
              JOIN products p ON c.product_id = p.id
              WHERE c.user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "status" => "success",
        "data" => $cartItems
    ]);
} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    error_log("Cart POST - User: $userId, Product: " . ($data->product_id ?? 'null') . ", Qty: " . ($data->quantity ?? 'null'));
    
    if (isset($data->product_id) && isset($data->quantity)) {
        // Check if item already exists in cart
        $check = "SELECT id FROM cart WHERE user_id = :user_id AND product_id = :product_id";
        $stmt_check = $db->prepare($check);
        $stmt_check->bindParam(':user_id', $userId);
        $stmt_check->bindParam(':product_id', $data->product_id);
        $stmt_check->execute();
        
        if ($stmt_check->rowCount() > 0) {
            $query = "UPDATE cart SET quantity = quantity + :quantity WHERE user_id = :user_id AND product_id = :product_id";
        } else {
            $query = "INSERT INTO cart (user_id, product_id, quantity) VALUES (:user_id, :product_id, :quantity)";
        }
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':product_id', $data->product_id);
        $stmt->bindParam(':quantity', $data->quantity);
        
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Cart updated successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to update cart"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid product or quantity"]);
    }
} elseif ($method == 'DELETE') {
    $cart_id = isset($_GET['id']) ? $_GET['id'] : null;
    
    if ($cart_id) {
        $query = "DELETE FROM cart WHERE id = :id AND user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $cart_id);
        $stmt->bindParam(':userId', $userId);
        
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Item removed from cart"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to remove item"]);
        }
    }
}
?>
