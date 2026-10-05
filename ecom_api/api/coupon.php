<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../core/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

$data     = json_decode(file_get_contents("php://input"));
$code     = isset($data->code)     ? strtoupper(trim($data->code)) : null;
$subtotal = isset($data->subtotal) ? (float)$data->subtotal         : 0;

if (!$code) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Coupon code is required"]);
    exit();
}

$stmt = $db->prepare(
    "SELECT * FROM coupons
     WHERE code = :code
       AND status = 'active'
       AND (expiry_date IS NULL OR expiry_date >= CURDATE())
     LIMIT 1"
);
$stmt->bindParam(':code', $code);
$stmt->execute();
$coupon = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$coupon) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Invalid or expired coupon code"]);
    exit();
}

$minSpend = (float)($coupon['min_spend'] ?? 0);
if ($subtotal < $minSpend && $minSpend > 0) {
    http_response_code(400);
    echo json_encode([
        "status"  => "error",
        "message" => "Minimum order of \$$minSpend required for this coupon"
    ]);
    exit();
}

$couponType = $coupon['discount_type'];
$couponVal  = (float)$coupon['value'];

// Calculate discount
if ($couponType === 'percentage') {
    $discount = $subtotal * ($couponVal / 100);
} else {
    $discount = $couponVal;
}
$discount = round(min($discount, $subtotal), 2);

echo json_encode([
    "status"  => "success",
    "message" => "Coupon applied!",
    "coupon"  => [
        "code"     => $coupon['code'],
        "type"     => $couponType,
        "value"    => $couponVal,
        "discount" => $discount
    ]
]);
?>
