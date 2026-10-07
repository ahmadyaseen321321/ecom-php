<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS");
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

// GET — list all users
if ($method === 'GET') {
    $roleFilter = $_GET['role'] ?? '';
    $query = "SELECT id, full_name, email, phone, role, status, created_at FROM users";
    $params = [];
    if ($roleFilter) {
        $query .= " WHERE role = :role";
        $params[':role'] = $roleFilter;
    }
    $query .= " ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    foreach ($params as $k => &$v) $stmt->bindParam($k, $v);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit();
}

// PUT — update user (block/unblock/change role)
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $targetId = $data['user_id'] ?? null;
    if (!$targetId) {
        echo json_encode(["status" => "error", "message" => "user_id required"]);
        exit();
    }

    $sets = [];
    $params = [':id' => $targetId];

    if (isset($data['status'])) {
        $sets[] = "status = :status";
        $params[':status'] = $data['status'];
    }
    if (isset($data['role'])) {
        $sets[] = "role = :role";
        $params[':role'] = $data['role'];
    }

    if (empty($sets)) {
        echo json_encode(["status" => "error", "message" => "Nothing to update"]);
        exit();
    }

    $sql = "UPDATE users SET " . implode(', ', $sets) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    echo json_encode(["status" => "success", "message" => "User updated"]);
    exit();
}

// DELETE — remove user
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        echo json_encode(["status" => "error", "message" => "User ID required"]);
        exit();
    }
    $stmt = $db->prepare("DELETE FROM users WHERE id = :id AND id != :admin_id");
    $stmt->execute([':id' => $id, ':admin_id' => $userId]);
    echo json_encode(["status" => "success", "message" => "User deleted"]);
    exit();
}

http_response_code(405);
echo json_encode(["message" => "Method not allowed"]);
?>
