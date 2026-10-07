<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

require_once '../../core/database.php';
require_once '../../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();
$jwtHelper = new JWTHelper();

$userId = $jwtHelper->validateTokenAndGetUserId();
$role = $jwtHelper->getRole();

if (!$userId || $role !== 'admin') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Admin access required"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM categories ORDER BY name ASC");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $result = [];
    foreach ($categories as $c) {
        $result[] = [
            "id" => (int)$c['id'],
            "name" => $c['name'],
            "icon" => $c['icon'],
            "image_url" => $c['icon'], // in case icon holds image url
            "parent_id" => $c['parent_id'] ? (int)$c['parent_id'] : null
        ];
    }
    
    echo json_encode($result);
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = isset($data['name']) ? trim($data['name']) : '';
    $icon = isset($data['icon']) ? trim($data['icon']) : (isset($data['image_url']) ? trim($data['image_url']) : null);
    $parentId = isset($data['parent_id']) && !empty($data['parent_id']) ? intval($data['parent_id']) : null;
    
    if (empty($name)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Category name is required"]);
        exit();
    }
    
    $stmt = $db->prepare("INSERT INTO categories (name, icon, parent_id) VALUES (:name, :icon, :parent_id)");
    if ($stmt->execute([':name' => $name, ':icon' => $icon, ':parent_id' => $parentId])) {
        $id = $db->lastInsertId();
        echo json_encode([
            "status" => "success",
            "message" => "Category created successfully",
            "data" => [
                "id" => (int)$id,
                "name" => $name,
                "icon" => $icon,
                "parent_id" => $parentId
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to create category"]);
    }
    exit();
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Category ID is required"]);
        exit();
    }
    
    $stmt = $db->prepare("DELETE FROM categories WHERE id = :id");
    if ($stmt->execute([':id' => $id])) {
        echo json_encode(["status" => "success", "message" => "Category deleted successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to delete category"]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
?>
