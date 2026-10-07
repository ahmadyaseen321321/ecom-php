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
    $stmt = $db->query("SELECT * FROM coupons ORDER BY id DESC");
    $coupons = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $result = [];
    foreach ($coupons as $c) {
        $type = ($c['discount_type'] === 'fixed' || $c['discount_type'] === 'flat') ? 'flat' : 'percentage';
        $discountVal = (float)$c['value'];
        $discountFormatted = $type === 'percentage' ? $discountVal . '%' : '$' . $discountVal;
        
        $result[] = [
            "id" => (int)$c['id'],
            "code" => $c['code'],
            "discount" => $type === 'percentage' ? (string)$discountVal : (string)$discountVal,
            "discount_display" => $discountFormatted,
            "type" => $type,
            "discount_type" => $c['discount_type'],
            "value" => $discountVal,
            "min_spend" => (float)$c['min_spend'],
            "expires" => $c['expiry_date'] ? date('M j, Y', strtotime($c['expiry_date'])) : 'Never',
            "expiry_date" => $c['expiry_date'],
            "status" => $c['status'],
            "uses" => 0
        ];
    }
    
    echo json_encode($result);
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $code = isset($data['code']) ? strtoupper(trim($data['code'])) : '';
    $rawType = isset($data['type']) ? strtolower(trim($data['type'])) : (isset($data['discount_type']) ? strtolower(trim($data['discount_type'])) : 'percentage');
    $discountType = ($rawType === 'flat' || $rawType === 'fixed') ? 'fixed' : 'percentage';
    
    $discountVal = isset($data['discount']) ? floatval($data['discount']) : (isset($data['value']) ? floatval($data['value']) : 0);
    $minSpend = isset($data['min_spend']) ? floatval($data['min_spend']) : 0;
    
    $expires = isset($data['expires']) ? trim($data['expires']) : (isset($data['expiry_date']) ? trim($data['expiry_date']) : null);
    if (!$expires) {
        $expires = date('Y-m-d', strtotime('+30 days'));
    } else {
        $expires = date('Y-m-d', strtotime($expires));
    }
    
    if (empty($code) || $discountVal <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Valid coupon code and discount value are required"]);
        exit();
    }
    
    // Check if code already exists
    $checkStmt = $db->prepare("SELECT id FROM coupons WHERE code = :code");
    $checkStmt->execute([':code' => $code]);
    if ($checkStmt->fetch()) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Coupon code already exists"]);
        exit();
    }
    
    $stmt = $db->prepare("INSERT INTO coupons (code, discount_type, value, min_spend, expiry_date, status) VALUES (:code, :discount_type, :value, :min_spend, :expiry_date, 'active')");
    $success = $stmt->execute([
        ':code' => $code,
        ':discount_type' => $discountType,
        ':value' => $discountVal,
        ':min_spend' => $minSpend,
        ':expiry_date' => $expires
    ]);
    
    if ($success) {
        $id = $db->lastInsertId();
        echo json_encode([
            "status" => "success",
            "message" => "Coupon created successfully",
            "data" => [
                "id" => (int)$id,
                "code" => $code,
                "discount" => (string)$discountVal,
                "type" => $discountType === 'fixed' ? 'flat' : 'percentage',
                "expires" => date('M j, Y', strtotime($expires)),
                "uses" => 0
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to create coupon"]);
    }
    exit();
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Coupon ID is required"]);
        exit();
    }
    
    $stmt = $db->prepare("DELETE FROM coupons WHERE id = :id");
    if ($stmt->execute([':id' => $id])) {
        echo json_encode(["status" => "success", "message" => "Coupon deleted successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to delete coupon"]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
?>
