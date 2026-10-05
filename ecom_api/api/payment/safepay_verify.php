<?php
require_once '../../core/config.php';
require_once '../../core/database.php';
require_once '../../core/jwt_helper.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

// Verify auth token
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$jwt = $matches[1];
$userId = verify_jwt($jwt);

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->reference) || empty($data->reference)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Payment reference is required']);
    exit;
}

// In a real implementation you would call safepay verification API here
// using their signature validation or status endpoint with your secret key.
// e.g., verifying if the transaction associated with tracker/reference is successfully Paid.
$isPaymentValid = true; // Simulating successful validation for now

if ($isPaymentValid) {
    echo json_encode([
        'success' => true,
        'message' => 'Payment successfully verified'
    ]);
} else {
     echo json_encode([
        'success' => false,
        'message' => 'Payment verification failed'
    ]);
}
?>
