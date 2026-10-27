<?php
require_once '../core/config.php';
require_once '../core/database.php';

header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
$email = isset($data->email) ? strtolower(trim($data->email)) : '';
$code = isset($data->otp) ? trim($data->otp) : '';
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{6}$/', $code)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Enter a valid email and 6-digit code."]);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$db->beginTransaction();

try {
    $stmt = $db->prepare(
        "SELECT u.id, ev.code_hash, ev.expires_at, ev.attempts
         FROM users u
         JOIN email_verification_codes ev ON ev.user_id = u.id
         WHERE u.email = ? AND u.email_verified = 0 AND ev.expires_at > NOW()
         LIMIT 1 FOR UPDATE"
    );
    $stmt->execute([$email]);
    $verification = $stmt->fetch(PDO::FETCH_ASSOC);

    if (
        !$verification
        || (int) $verification['attempts'] >= 5
    ) {
        $db->commit();
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "The code is invalid or expired. Request a new code and try again."]);
        exit();
    }

    if (!password_verify($code, $verification['code_hash'])) {
        $db->prepare("UPDATE email_verification_codes SET attempts = attempts + 1 WHERE user_id = ?")
            ->execute([$verification['id']]);
        $db->commit();
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "The code is incorrect. Please try again."]);
        exit();
    }

    $db->prepare("UPDATE users SET email_verified = 1 WHERE id = ?")->execute([$verification['id']]);
    $db->prepare("DELETE FROM email_verification_codes WHERE user_id = ?")->execute([$verification['id']]);
    $db->commit();

    echo json_encode(["status" => "success", "message" => "Email verified successfully."]);
} catch (Throwable $exception) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Email verification failed: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Unable to verify email right now. Please try again."]);
}
?>
