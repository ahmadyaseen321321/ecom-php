<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();
$jwtHelper = new JWTHelper();

$userId = $jwtHelper->validateTokenAndGetUserId();
$role = $jwtHelper->getRole();

if (!$userId || $role != 'seller') {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

// 1. Get seller_id from user_id
$query = "SELECT id FROM sellers WHERE user_id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $userId);
$stmt->execute();
$seller = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$seller) {
    echo json_encode(["status" => "error", "message" => "Seller account not found"]);
    exit();
}

$sellerId = $seller['id'];

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    // Fetch reviews for products owned by this seller
    try {
        $query = "SELECT 
                    r.id, 
                    p.name as product_name, 
                    u.full_name as user_name, 
                    r.rating, 
                    r.comment, 
                    r.image_url,
                    r.reply,
                    r.replied_at,
                    r.created_at 
                  FROM reviews r 
                  JOIN products p ON r.product_id = p.id 
                  JOIN users u ON r.user_id = u.id 
                  WHERE p.seller_id = :seller_id 
                  ORDER BY r.created_at DESC";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':seller_id', $sellerId);
        $stmt->execute();
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => $reviews
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error", 
            "message" => "Database error: " . $e->getMessage()
        ]);
    }
} elseif ($method == 'POST') {
    // Handle review reply submission
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        $input = $_POST;
    }

    $review_id = $input['review_id'] ?? null;
    $reply = $input['reply'] ?? null;

    if (!$review_id || !$reply) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing required fields: review_id and reply"]);
        exit();
    }

    try {
        // First, verify the seller owns the product associated with this review
        $verifyQuery = "SELECT r.id FROM reviews r 
                        JOIN products p ON r.product_id = p.id 
                        WHERE r.id = :review_id AND p.seller_id = :seller_id";
        $vStmt = $db->prepare($verifyQuery);
        $vStmt->bindParam(':review_id', $review_id);
        $vStmt->bindParam(':seller_id', $sellerId);
        $vStmt->execute();

        if (!$vStmt->fetch()) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Unauthorized: You do not own the product for this review"]);
            exit();
        }

        // Update the review with the reply
        $updateQuery = "UPDATE reviews SET reply = :reply, replied_at = NOW() WHERE id = :review_id";
        $uStmt = $db->prepare($updateQuery);
        $uStmt->bindParam(':reply', $reply);
        $uStmt->bindParam(':review_id', $review_id);

        if ($uStmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Reply posted successfully"]);
        } else {
            throw new Exception("Failed to update database");
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Server Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>