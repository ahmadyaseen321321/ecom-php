<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();
$jwtHelper = new JWTHelper();

if (!$db) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $product_id = isset($_GET['product_id']) ? $_GET['product_id'] : null;

    if ($product_id !== null && $product_id !== '') {
        try {
            // Corrected column name from u.name to u.full_name
            $query = "SELECT r.*, u.full_name as user_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.product_id = :product_id ORDER BY r.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':product_id', $product_id);

            if ($stmt->execute()) {
                $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
                header("Content-Type: application/json; charset=UTF-8");
                echo json_encode([
                    "status" => "success",
                    "data" => $reviews,
                    "debug_pid" => $product_id
                ]);
            } else {
                $error = $stmt->errorInfo();
                header("Content-Type: application/json; charset=UTF-8");
                echo json_encode(["status" => "error", "message" => "SQL Error: " . ($error[2] ?? "Unknown")]);
            }
        } catch (Exception $e) {
            header("Content-Type: application/json; charset=UTF-8");
            echo json_encode(["status" => "error", "message" => "Server Error: " . $e->getMessage()]);
        }
    } else {
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode(["status" => "error", "message" => "Missing product_id parameter"]);
    }
} elseif ($method == 'POST') {
    $userId = $jwtHelper->validateTokenAndGetUserId();
    if (!$userId) {
        http_response_code(401);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
        exit();
    }

    $product_id = $_POST['product_id'] ?? null;
    $rating = $_POST['rating'] ?? null;
    $comment = $_POST['comment'] ?? null;

    if (!$product_id) {
        $json = json_decode(file_get_contents("php://input"));
        if ($json) {
            $product_id = $json->product_id ?? null;
            $rating = $json->rating ?? null;
            $comment = $json->comment ?? null;
        }
    }

    if (!empty($product_id) && !empty($rating) && !empty($comment)) {
        $image_url = null;

        try {
            if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
                $target_dir = "../uploads/reviews/";
                if (!is_dir($target_dir)) {
                    @mkdir($target_dir, 0777, true);
                }

                $file_ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
                $allowed_exts = ['jpg', 'jpeg', 'png', 'webp'];

                if (in_array($file_ext, $allowed_exts)) {
                    $file_name = uniqid('rev_') . '.' . $file_ext;
                    $target_file = $target_dir . $file_name;

                    if (move_uploaded_file($_FILES['image']['tmp_name'], $target_file)) {
                        $image_url = "uploads/reviews/" . $file_name;
                    }
                }
            }

            $query = "INSERT INTO reviews (user_id, product_id, rating, comment, image_url) VALUES (:user_id, :product_id, :rating, :comment, :image_url)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':product_id', $product_id);
            $stmt->bindParam(':rating', $rating);
            $stmt->bindParam(':comment', $comment);
            $stmt->bindParam(':image_url', $image_url);

            if ($stmt->execute()) {
                header("Content-Type: application/json; charset=UTF-8");
                echo json_encode(["status" => "success", "message" => "Review submitted successfully", "image" => $image_url]);
            } else {
                $errorInfo = $stmt->errorInfo();
                header("Content-Type: application/json; charset=UTF-8");
                echo json_encode(["status" => "error", "message" => "SQL Error: " . ($errorInfo[2] ?? "Unknown")]);
            }
        } catch (Exception $e) {
            header("Content-Type: application/json; charset=UTF-8");
            echo json_encode(["status" => "error", "message" => "Server logic error: " . $e->getMessage()]);
        }
    } else {
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    }
}
?>