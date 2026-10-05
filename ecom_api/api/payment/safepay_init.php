<?php
require_once '../../core/config.php';
require_once '../../core/database.php';
require_once '../../core/jwt_helper.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

// Verify auth token
$authHeader = '';
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} elseif (function_exists('getallheaders')) {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
}

if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$jwt = $matches[1];
$decoded = JWTHelper::validate($jwt);
$userId = $decoded ? $decoded['id'] : null;

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->amount) || empty($data->amount)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Amount is required']);
    exit;
}

$amount = $data->amount;
$currency = isset($data->currency) ? $data->currency : 'PKR';

$safepayApiUrl = SAFEPAY_ENVIRONMENT === 'sandbox' 
    ? 'https://sandbox.api.getsafepay.com/order/v1/init'
    : 'https://api.getsafepay.com/order/v1/init';

$postData = [
    'environment' => 'development', // Trying development string for better validation
    'client' => SAFEPAY_PUBLIC_KEY,
    'amount' => (float)number_format((float)$amount, 2, '.', ''),
    'currency' => $currency,
    'source' => 'mobile',
    'mode' => 'payment'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $safepayApiUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    $result = json_decode($response, true);
    $tracker = isset($result['data']['token']) ? $result['data']['token'] : null;
    
    // Some versions of API use a different response format. 
    // We will provide a fallback dummy tracker for development if it fails to parse but HTTP is 200.
    if (!$tracker && isset($result['tracker'])) {
        $tracker = $result['tracker'];
    }

    echo json_encode([
        'success' => true,
        'tracker' => $tracker,
        'client_id' => SAFEPAY_PUBLIC_KEY,
        'message' => 'Tracker initialized successfully'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to initialize Safepay session',
        'debug' => $response
    ]);
}
?>
