<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// ─── GET: Fetch categories (public / seller / admin) ─────────────────────────
if ($method === 'GET') {
    $query = "SELECT c.*, 
              (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status != 'deleted') as product_count
              FROM categories c 
              ORDER BY c.name ASC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($categories as &$cat) {
        $cat['image'] = $cat['icon'];
        $cat['image_url'] = $cat['icon'];
    }

    echo json_encode([
        "status" => "success",
        "data" => $categories
    ]);
    exit();
}

// ─── Mutations (POST / DELETE) require Seller or Admin JWT ───────────────────
$jwtHelper = new JWTHelper();
$userId = $jwtHelper->validateTokenAndGetUserId();
$role = $jwtHelper->getRole();

if (!$userId || ($role !== 'seller' && $role !== 'admin')) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Seller or Admin authorization required"]);
    exit();
}

// ─── POST: Add or Update a Category ──────────────────────────────────────────
if ($method === 'POST') {
    // Support multipart (with file upload) or JSON payload
    $name = isset($_POST['name']) ? trim($_POST['name']) : '';
    $icon = isset($_POST['icon']) ? trim($_POST['icon']) : '';
    $parentId = !empty($_POST['parent_id']) ? intval($_POST['parent_id']) : null;
    $categoryId = !empty($_POST['id']) ? intval($_POST['id']) : null;

    if (empty($name)) {
        $raw = file_get_contents("php://input");
        $json = json_decode($raw, true);
        if ($json) {
            $name = isset($json['name']) ? trim($json['name']) : '';
            $icon = isset($json['icon']) ? trim($json['icon']) : (isset($json['image_url']) ? trim($json['image_url']) : '');
            $parentId = !empty($json['parent_id']) ? intval($json['parent_id']) : null;
            $categoryId = !empty($json['id']) ? intval($json['id']) : null;
        }
    }

    if (empty($name)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Category name is required"]);
        exit();
    }

    // Handle Picture Upload
    $uploadedImageUrl = null;
    if (isset($_FILES['image']) && (int)$_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $originalName = basename($_FILES['image']['name']);
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
        $maxBytes = 8 * 1024 * 1024; // 8MB

        if (!in_array($ext, $allowedExt)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Image must be PNG, JPG, WEBP, GIF, or SVG"]);
            exit();
        }

        if ((int)$_FILES['image']['size'] > $maxBytes) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Image size exceeds 8MB limit"]);
            exit();
        }

        $uploadDir = '../uploads/categories/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $cleanBase = preg_replace('/[^A-Za-z0-9_-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
        $newFilename = 'cat_' . time() . '_' . substr(md5(uniqid()), 0, 8) . '.' . $ext;
        $destPath = $uploadDir . $newFilename;

        if (move_uploaded_file($_FILES['image']['tmp_name'], $destPath)) {
            $uploadedImageUrl = 'uploads/categories/' . $newFilename;
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to save uploaded image"]);
            exit();
        }
    }

    // Determine final icon/image value
    $finalImageOrIcon = $uploadedImageUrl ? $uploadedImageUrl : ($icon ?: null);

    if ($categoryId) {
        // UPDATE existing category
        if ($uploadedImageUrl) {
            $sql = "UPDATE categories SET name = :name, icon = :icon, parent_id = :parent_id WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute([':name' => $name, ':icon' => $finalImageOrIcon, ':parent_id' => $parentId, ':id' => $categoryId]);
        } else {
            $sql = "UPDATE categories SET name = :name, parent_id = :parent_id" . ($finalImageOrIcon !== null ? ", icon = :icon" : "") . " WHERE id = :id";
            $stmt = $db->prepare($sql);
            $params = [':name' => $name, ':parent_id' => $parentId, ':id' => $categoryId];
            if ($finalImageOrIcon !== null) {
                $params[':icon'] = $finalImageOrIcon;
            }
            $stmt->execute($params);
        }

        echo json_encode([
            "status" => "success",
            "message" => "Category updated successfully",
            "data" => [
                "id" => $categoryId,
                "name" => $name,
                "icon" => $finalImageOrIcon,
                "image" => $finalImageOrIcon,
                "image_url" => $finalImageOrIcon,
                "parent_id" => $parentId
            ]
        ]);
        exit();
    } else {
        // INSERT new category
        $stmt = $db->prepare("INSERT INTO categories (name, icon, parent_id) VALUES (:name, :icon, :parent_id)");
        if ($stmt->execute([':name' => $name, ':icon' => $finalImageOrIcon, ':parent_id' => $parentId])) {
            $newId = (int)$db->lastInsertId();
            echo json_encode([
                "status" => "success",
                "message" => "Category created successfully",
                "data" => [
                    "id" => $newId,
                    "name" => $name,
                    "icon" => $finalImageOrIcon,
                    "image" => $finalImageOrIcon,
                    "image_url" => $finalImageOrIcon,
                    "parent_id" => $parentId
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error creating category"]);
        }
        exit();
    }
}

// ─── DELETE: Delete a Category ───────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (!$id) {
        $raw = file_get_contents("php://input");
        $json = json_decode($raw, true);
        if ($json && !empty($json['id'])) {
            $id = intval($json['id']);
        }
    }

    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Category ID is required"]);
        exit();
    }

    // Check if category is used by products
    $checkStmt = $db->prepare("SELECT COUNT(*) as cnt FROM products WHERE category_id = :id AND status != 'deleted'");
    $checkStmt->execute([':id' => $id]);
    $prodCount = (int)$checkStmt->fetchColumn();

    if ($prodCount > 0) {
        // Optional safety: user can still delete if force=1 is passed, otherwise prompt warning
        $force = isset($_GET['force']) && $_GET['force'] == '1';
        if (!$force) {
            http_response_code(409);
            echo json_encode([
                "status" => "error",
                "message" => "Cannot delete: {$prodCount} active product(s) are assigned to this category.",
                "product_count" => $prodCount
            ]);
            exit();
        } else {
            // Reassign products to 1 (or NULL) if forced
            $reassign = $db->prepare("UPDATE products SET category_id = NULL WHERE category_id = :id");
            $reassign->execute([':id' => $id]);
        }
    }

    $delStmt = $db->prepare("DELETE FROM categories WHERE id = :id");
    if ($delStmt->execute([':id' => $id])) {
        echo json_encode([
            "status" => "success",
            "message" => "Category deleted successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to delete category"]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
