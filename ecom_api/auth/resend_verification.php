<?php
require_once '../core/config.php';
require_once '../core/database.php';
require_once '../core/mail_helper.php';

header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
$email = isset($data->email) ? strtolower(trim($data->email)) : '';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Enter a valid email address."]);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$stmt = $db->prepare(
    "SELECT u.id, u.full_name,
            TIMESTAMPDIFF(SECOND, ev.sent_at, NOW()) AS seconds_since_sent
     FROM users u
     JOIN email_verification_codes ev ON ev.user_id = u.id
     WHERE u.email = ? AND u.email_verified = 0
     LIMIT 1"
);
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && (int) $user['seconds_since_sent'] >= 60) {
    $code = (string) random_int(100000, 999999);
    $db->prepare(
        "INSERT INTO email_verification_codes (user_id, code_hash, expires_at, attempts, sent_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0, NOW())
         ON DUPLICATE KEY UPDATE code_hash = VALUES(code_hash),
             expires_at = VALUES(expires_at), attempts = 0, sent_at = NOW()"
    )->execute([$user['id'], password_hash($code, PASSWORD_DEFAULT)]);

    try {
        sendEmailVerificationCode($email, $user['full_name'], $code);
    } catch (RuntimeException $exception) {
        error_log($exception->getMessage());
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to send the verification email. Please try again later."]);
        exit();
    }
}

echo json_encode([
    "status" => "success",
    "message" => "If this email has an unverified account, a new verification code has been sent."
]);
?>
