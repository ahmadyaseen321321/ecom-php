<?php
require_once '../core/config.php';
require_once '../core/database.php';
require_once '../core/mail_helper.php';

$data = json_decode(file_get_contents("php://input"));
$fullName = isset($data->full_name) ? trim($data->full_name) : '';
$email = isset($data->email) ? strtolower(trim($data->email)) : '';
$password = isset($data->password) ? $data->password : '';
$phone = isset($data->phone) ? trim($data->phone) : null;

if ($fullName === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !is_string($password) || $password === '') {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Enter your name, a valid email address, and a password."]);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
$stmt->execute([$email]);
if ($stmt->fetch(PDO::FETCH_ASSOC)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email already registered"]);
    exit();
}

$role = !empty($data->role) && in_array($data->role, ['user', 'seller'], true)
    ? $data->role
    : 'user';
$code = (string) random_int(100000, 999999);

try {
    $db->beginTransaction();
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare(
        "INSERT INTO users (full_name, email, phone, password, role, email_verified)
         VALUES (?, ?, ?, ?, ?, 0)"
    );
    $stmt->execute([$fullName, $email, $phone, $passwordHash, $role]);
    $userId = (int) $db->lastInsertId();

    if ($role === 'seller') {
        $shopName = !empty($data->shop_name) ? $data->shop_name : $fullName . "'s Shop";
        $db->prepare("INSERT INTO sellers (user_id, shop_name) VALUES (?, ?)")
            ->execute([$userId, $shopName]);
    }

    $db->prepare(
        "INSERT INTO email_verification_codes (user_id, code_hash, expires_at, attempts, sent_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0, NOW())"
    )->execute([$userId, password_hash($code, PASSWORD_DEFAULT)]);

    sendEmailVerificationCode($email, $fullName, $code);
    $db->commit();

    http_response_code(201);
    echo json_encode([
        "status" => "success",
        "message" => "Account created. Check your email for the verification code."
    ]);
} catch (Throwable $exception) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Account registration failed: ' . $exception->getMessage());
    http_response_code(503);
    echo json_encode([
        "status" => "error",
        "message" => "Unable to complete signup or send the verification email. Check SMTP setup and try again."
    ]);
}
?>
