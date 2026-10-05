<?php
error_reporting(E_ALL);
ini_set('display_errors', 0); // Keep JSON clean
ini_set('log_errors', 1);

// Custom error handler to return JSON even on fatal errors
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_COMPILE_ERROR)) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Server Error: " . $error['message']]);
        exit();
    }
});
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();
$db->exec("SET SESSION group_concat_max_len = 1000000"); // Ensure no truncation
$jwtHelper = new JWTHelper();

$method = $_SERVER['REQUEST_METHOD'];

// Consolidated Data Extraction
$input = file_get_contents("php://input");
$bodyData = json_decode($input, true) ?? [];
$requestParams = array_merge($_GET, $_POST, $bodyData);

// Method Spoofing: Check for '_method' in params (e.g., from Flutter)
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($requestParams['_method'])) {
    $method = strtoupper($requestParams['_method']);
}

// Extraction with Strict Typing
$id = isset($requestParams['id']) ? (int) $requestParams['id'] : 0;
$source = isset($requestParams['source']) ? $requestParams['source'] : '';

// ---------------------------------------------------------
// ROUTE 1: GET (Fetch Products)
// ---------------------------------------------------------
if ($method === 'GET') {
    $category_id = $requestParams['category_id'] ?? null;
    $search = $requestParams['search'] ?? null;
    $seller_id = $requestParams['seller_id'] ?? null;

    if ($seller_id === 'current') {
        $userId = $jwtHelper->validateTokenAndGetUserId();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Unauthorized"]);
            exit();
        }
        $query = "SELECT p.*, c.name as category_name, 
                  (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image,
                  (SELECT GROUP_CONCAT(image_url SEPARATOR ',') FROM product_images WHERE product_id = p.id) as all_images
                  FROM products p 
                  JOIN categories c ON p.category_id = c.id 
                  JOIN sellers s ON p.seller_id = s.id 
                  WHERE s.user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "data" => $products]);
        exit();
    }

    $query = "SELECT p.*, c.name as category_name, 
              (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image,
              (SELECT GROUP_CONCAT(image_url SEPARATOR ',') FROM product_images WHERE product_id = p.id) as all_images
              FROM products p 
              JOIN categories c ON p.category_id = c.id";
    $params = [];

    if ($category_id) {
        $query .= " WHERE p.category_id = :category_id";
        $params[':category_id'] = $category_id;
    }

    if ($search) {
        $query .= ($category_id ? " AND" : " WHERE") . " (p.name LIKE :search OR p.description LIKE :search_desc)";
        $like = "%$search%";
        $params[':search'] = $like;
        $params[':search_desc'] = $like;
    }

    $query .= " ORDER BY p.created_at DESC";


    $stmt = $db->prepare($query);
    foreach ($params as $key => &$val)
        $stmt->bindParam($key, $val);
    $stmt->execute();

    echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit();
}


// ---------------------------------------------------------
// AUTHENTICATION CHECK FOR MUTATION (POST, PUT, DELETE)
// ---------------------------------------------------------
$userId = $jwtHelper->validateTokenAndGetUserId();
$role = $jwtHelper->getRole();
if (!$userId || $role !== 'seller') {
    http_response_code(401);
    die(json_encode(["status" => "error", "message" => "Unauthorized: Seller role required"]));
}

// ---------------------------------------------------------
// ROUTE 2: POST (Create / Add New)
// ---------------------------------------------------------
if ($method === 'POST') {
    if ($id > 0 || $source === 'edit') {
        die(json_encode([
            "status" => "error",
            "message" => "CRITICAL: Ambiguous request. Edit data received on Create route.",
        ]));
    }

    try {
        $stmt = $db->prepare("SELECT id FROM sellers WHERE user_id = :uid");
        $stmt->bindValue(':uid', $userId);
        $stmt->execute();
        $s = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$s)
            die(json_encode(["status" => "error", "message" => "No seller profile found."]));

        $db->beginTransaction();

        $variants = isset($requestParams['variants']) ? $requestParams['variants'] : null;

        $sql = "INSERT INTO products (seller_id, category_id, name, description, price, discount_price, stock, variants, status) 
                VALUES (:sid, :cat, :name, :desc, :price, :disc, :stock, :vars, 'active')";
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':sid', $s['id']);
        $stmt->bindValue(':cat', $requestParams['category_id']);
        $stmt->bindValue(':name', $requestParams['name']);
        $stmt->bindValue(':desc', $requestParams['description']);
        $stmt->bindValue(':price', $requestParams['price']);
        $stmt->bindValue(':disc', ($requestParams['discount_price'] ?? '') !== '' ? $requestParams['discount_price'] : null);
        $stmt->bindValue(':stock', $requestParams['stock']);
        $stmt->bindValue(':vars', $variants);

        if ($stmt->execute()) {
            $productId = $db->lastInsertId();
            $uploadDir = "../uploads/products/";
            if (!is_dir($uploadDir))
                mkdir($uploadDir, 0777, true);

            $allImages = [];

            // 1. Handle General Images (images[])
            if (isset($_FILES['images'])) {
                $files = $_FILES['images'];
                $count = is_array($files['name']) ? count($files['name']) : 1;
                for ($i = 0; $i < $count; $i++) {
                    $tmpName = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
                    $name = is_array($files['name']) ? $files['name'][$i] : $files['name'];
                    if ($tmpName) {
                        $ext = pathinfo($name, PATHINFO_EXTENSION);
                        $newName = uniqid('prod_') . '_' . $i . '.' . $ext;
                        if (move_uploaded_file($tmpName, $uploadDir . $newName)) {
                            $imageUrl = "uploads/products/" . $newName;
                            $isMain = ($i === 0) ? 1 : 0;
                            $imgStmt = $db->prepare("INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, ?)");
                            $imgStmt->execute([$productId, $imageUrl, $isMain]);
                        }
                    }
                }
            }

            // 2. Handle Variant Images (variant_images[])
            // Note: The frontend will need to map these to the variants JSON
            if (isset($_FILES['variant_images'])) {
                $vFiles = $_FILES['variant_images'];
                $vCount = is_array($vFiles['name']) ? count($vFiles['name']) : 1;
                for ($i = 0; $i < $vCount; $i++) {
                    $tmpName = is_array($vFiles['tmp_name']) ? $vFiles['tmp_name'][$i] : $vFiles['tmp_name'];
                    $name = is_array($vFiles['name']) ? $vFiles['name'][$i] : $vFiles['name'];
                    if ($tmpName) {
                        $ext = pathinfo($name, PATHINFO_EXTENSION);
                        $newName = uniqid('var_') . '_' . $i . '.' . $ext;
                        if (move_uploaded_file($tmpName, $uploadDir . $newName)) {
                            $imageUrl = "uploads/products/" . $newName;
                            // Variant images are added to product_images but not as main
                            $imgStmt = $db->prepare("INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, 0)");
                            $imgStmt->execute([$productId, $imageUrl]);
                        }
                    }
                }
            }

            $db->commit();
            die(json_encode(["status" => "success", "message" => "Product published with images.", "id" => $productId]));
        } else {
            $db->rollBack();
            die(json_encode(["status" => "error", "message" => "Insert failed"]));
        }
    } catch (Exception $e) {
        if ($db->inTransaction())
            $db->rollBack();
        die(json_encode(["status" => "error", "message" => "System Exception: " . $e->getMessage()]));
    }
}


// ---------------------------------------------------------
// ROUTE 3: PUT / PATCH (Update Existing)
// Only keys present in JSON body ($bodyData) override; others keep DB values (partial update).
// ---------------------------------------------------------
if ($method === 'PUT' || $method === 'PATCH') {
    if ($id <= 0) {
        die(json_encode(["status" => "error", "message" => "Product ID required for update."]));
    }

    try {
        $check = "SELECT p.id, p.category_id, p.name, p.description, p.price, p.discount_price, p.stock
                  FROM products p
                  JOIN sellers s ON p.seller_id = s.id
                  WHERE p.id = :id AND s.user_id = :user_id";
        $stmt = $db->prepare($check);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(403);
            die(json_encode(["status" => "error", "message" => "Permission Denied: Product not found or not owned by you."]));
        }

        $db->beginTransaction();

        // Unify data source: check JSON body first, then fallback to $_POST/GET ($requestParams)
        $body = !empty($bodyData) ? $bodyData : $requestParams;

        $cat = array_key_exists('category_id', $body) ? (int) $body['category_id'] : (int) $row['category_id'];
        $name = array_key_exists('name', $body) ? $body['name'] : $row['name'];
        $desc = array_key_exists('description', $body) ? $body['description'] : $row['description'];
        $price = array_key_exists('price', $body) ? $body['price'] : $row['price'];
        $stock = array_key_exists('stock', $body) ? (int) $body['stock'] : (int) $row['stock'];

        if (array_key_exists('discount_price', $body)) {
            $dp = $body['discount_price'];
            $disc = ($dp === null || $dp === '' || $dp === 'null') ? null : $dp;
        } else {
            $disc = $row['discount_price'];
        }

        $sql = "UPDATE products SET category_id = :cat, name = :name, description = :desc, price = :price, discount_price = :disc, stock = :stock WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':cat', $cat, PDO::PARAM_INT);
        $stmt->bindValue(':name', $name, PDO::PARAM_STR);
        $stmt->bindValue(':desc', $desc, PDO::PARAM_STR);
        $stmt->bindValue(':price', $price);
        $stmt->bindValue(':disc', $disc !== null && $disc !== '' ? $disc : null);
        $stmt->bindValue(':stock', $stock, PDO::PARAM_INT);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        $stmt->execute();

        // --- IMAGE MANAGEMENT ---
        if (isset($body['existing_images'])) {
            $existingImages = json_decode($body['existing_images'], true) ?? [];
            
            // Normalize URLs to relative paths for DB comparison
            // Example input: "http://localhost/ecom_app/uploads/products/xyz.jpg"
            // DB contains: "uploads/products/xyz.jpg"
            $relativePaths = array_map(function($url) {
                if (strpos($url, 'uploads/') !== false) {
                    return substr($url, strpos($url, 'uploads/'));
                }
                return $url;
            }, $existingImages);

            // 1. Delete images not in the existing list
            if (!empty($relativePaths)) {
                $placeholders = implode(',', array_fill(0, count($relativePaths), '?'));
                $delQuery = "DELETE FROM product_images WHERE product_id = ? AND image_url NOT LIKE '%var_%' AND image_url NOT IN ($placeholders)";
                $delStmt = $db->prepare($delQuery);
                $delStmt->execute(array_merge([$id], $relativePaths));
            } else {
                // If existing_images is empty, delete all current images (new ones might be added below)
                // BUT DO NOT delete variant images!
                $delStmt = $db->prepare("DELETE FROM product_images WHERE product_id = ? AND image_url NOT LIKE '%var_%'");
                $delStmt->execute([$id]);
            }

            // 2. Add new images
            if (isset($_FILES['new_images'])) {
                $uploadDir = "../uploads/products/";
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

                $files = $_FILES['new_images'];
                $count = is_array($files['name']) ? count($files['name']) : 1;
                for ($i = 0; $i < $count; $i++) {
                    $tmpName = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
                    $fname = is_array($files['name']) ? $files['name'][$i] : $files['name'];
                    if ($tmpName) {
                        $ext = pathinfo($fname, PATHINFO_EXTENSION);
                        $newName = uniqid('prod_upd_') . '_' . $i . '.' . $ext;
                        if (move_uploaded_file($tmpName, $uploadDir . $newName)) {
                            $imageUrl = "uploads/products/" . $newName;
                            $imgStmt = $db->prepare("INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, 0)");
                            $imgStmt->execute([$id, $imageUrl]);
                        }
                    }
                }
            }

            // 3. Ensure one image is marked as main (the first one found)
            $db->prepare("UPDATE product_images SET is_main = 0 WHERE product_id = ? AND image_url NOT LIKE '%var_%'")->execute([$id]);
            $db->prepare("UPDATE product_images SET is_main = 1 WHERE product_id = ? AND image_url NOT LIKE '%var_%' ORDER BY id ASC LIMIT 1")->execute([$id]);
        }

        $db->commit();
        echo json_encode(["status" => "success", "message" => "Product update successful."]);
        exit();
    } catch (Exception $e) {
        if ($db->inTransaction()) $db->rollBack();
        die(json_encode(["status" => "error", "message" => "System Exception: " . $e->getMessage()]));
    }
}

// ---------------------------------------------------------
// ROUTE 4: DELETE (Remove Product)
// ---------------------------------------------------------
if ($method === 'DELETE') {
    $userId = $jwtHelper->validateTokenAndGetUserId();
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Unauthorized"]);
        exit();
    }

    $id = isset($_GET['id']) ? $_GET['id'] : null;
    if (!$id) {
        echo json_encode(["status" => "error", "message" => "Product ID required for deletion"]);
        exit();
    }

    // Verify ownership
    $query = "SELECT p.id FROM products p 
              JOIN sellers s ON p.seller_id = s.id 
              WHERE p.id = :id AND s.user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Forbidden: Product not found or ownership missing"]);
        exit();
    }

    $query = "DELETE FROM products WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Product deleted"]);
    } else {
        $error = $stmt->errorInfo();
        echo json_encode(["status" => "error", "message" => "Failed to delete: " . $error[2]]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
}
?>