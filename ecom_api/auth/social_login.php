<?php
require_once '../core/config.php';
require_once '../core/database.php';
require_once '../core/jwt_helper.php';
require_once '../core/google_auth.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
$provider = !empty($data->provider) ? strtolower(trim($data->provider)) : '';
if (!in_array($provider, ['google', 'facebook'], true)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Unsupported social sign-in provider."]);
    exit();
}

try {
    if ($provider === 'google') {
        $claims = verifyGoogleIdToken($data->id_token ?? '');
        $email = strtolower(trim($claims['email']));
        $providerId = $claims['sub'];
        $fullName = trim($claims['name'] ?? '');
        if ($fullName === '') {
            $fullName = $email;
        }
    } else {
        $email = !empty($data->email) ? strtolower(trim($data->email)) : '';
        $providerId = !empty($data->provider_id) ? trim($data->provider_id) : '';
        $fullName = !empty($data->full_name) ? trim($data->full_name) : 'User';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $providerId === '') {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Incomplete social sign-in data."]);
            exit();
        }
    }

    $database = new Database();
    $db = $database->getConnection();

    $columns = $db->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
    foreach (['provider' => "VARCHAR(50) DEFAULT NULL", 'provider_id' => "VARCHAR(255) DEFAULT NULL"] as $column => $definition) {
        if (!in_array($column, $columns, true)) {
            $db->exec("ALTER TABLE users ADD COLUMN $column $definition");
        }
    }

    $selectUser = "SELECT u.id, u.full_name, u.email, u.role, u.status, u.provider, u.provider_id,
                          u.email_verified, s.id AS seller_id
                   FROM users u
                   LEFT JOIN sellers s ON u.id = s.user_id";
    if ($provider === 'google') {
        $stmt = $db->prepare($selectUser . " WHERE u.provider = 'google' AND u.provider_id = ? LIMIT 1");
        $stmt->execute([$providerId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user && strcasecmp($user['email'], $email) !== 0) {
            http_response_code(409);
            echo json_encode([
                "status" => "error",
                "message" => "This Google account is already connected to an account with a different email."
            ]);
            exit();
        }
    } else {
        $user = false;
    }

    if (!$user) {
        $stmt = $db->prepare($selectUser . " WHERE LOWER(u.email) = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    $accountAction = 'existing';

    if ($user && $provider === 'google' && $user['provider'] === 'google'
        && !empty($user['provider_id']) && !hash_equals($user['provider_id'], $providerId)) {
        http_response_code(409);
        echo json_encode([
            "status" => "error",
            "message" => "This email is already linked to a different Google account."
        ]);
        exit();
    }

    if ($user) {
        if ($user['status'] === 'blocked') {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Account is blocked"]);
            exit();
        }

        if ($provider === 'google') {
            if ((int) $user['email_verified'] === 0) {
                $db->prepare("UPDATE users SET email_verified = 1 WHERE id = ?")->execute([$user['id']]);
            }
            if (empty($user['provider'])) {
                $db->prepare("UPDATE users SET provider = 'google' WHERE id = ?")->execute([$user['id']]);
                $user['provider'] = 'google';
            }
            if (empty($user['provider_id'])) {
                $db->prepare("UPDATE users SET provider_id = ? WHERE id = ?")->execute([$providerId, $user['id']]);
                $user['provider_id'] = $providerId;
                $accountAction = 'linked';
            }
        } elseif (empty($user['provider'])) {
            $db->prepare("UPDATE users SET provider = ?, provider_id = ? WHERE id = ?")
                ->execute([$provider, $providerId, $user['id']]);
            $accountAction = 'linked';
        }
    } else {
        $randomPassword = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);
        $stmt = $db->prepare(
            "INSERT INTO users (full_name, email, password, role, provider, provider_id, email_verified)
             VALUES (?, ?, ?, 'user', ?, ?, 1)"
        );
        $stmt->execute([$fullName, $email, $randomPassword, $provider, $providerId]);
        $user = [
            'id' => $db->lastInsertId(),
            'full_name' => $fullName,
            'email' => $email,
            'role' => 'user',
            'seller_id' => null
        ];
        $accountAction = 'created';
    }

    $tokenData = [
        "id" => $user['id'],
        "email" => $user['email'],
        "role" => $user['role'],
        "seller_id" => $user['seller_id']
    ];
    $jwt = JWTHelper::generate($tokenData);

    echo json_encode([
        "status" => "success",
        "message" => "Login successful",
        "account_action" => $accountAction,
        "token" => $jwt,
        "user" => [
            "id" => $user['id'],
            "full_name" => $user['full_name'],
            "email" => $user['email'],
            "role" => $user['role'],
            "seller_id" => $user['seller_id']
        ]
    ]);
} catch (Throwable $exception) {
    error_log('Social sign-in failed: ' . $exception->getMessage());
    http_response_code(401);
    echo json_encode([
        "status" => "error",
        "message" => $provider === 'google'
            ? "Google sign-in could not be verified. Please try again."
            : "Unable to complete social sign-in. Please try again."
    ]);
}
?>
