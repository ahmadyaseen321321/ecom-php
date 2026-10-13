<?php
require_once '../core/config.php';
require_once '../core/database.php';
require_once '../core/jwt_helper.php';

// Allow CORS if needed
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();

// Schema self-repair: ensure provider & provider_id columns exist
try {
    $columns = $db->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('provider', $columns)) {
        $db->exec("ALTER TABLE users ADD COLUMN provider VARCHAR(50) DEFAULT NULL");
    }
    if (!in_array('provider_id', $columns)) {
        $db->exec("ALTER TABLE users ADD COLUMN provider_id VARCHAR(255) DEFAULT NULL");
    }
} catch (Exception $e) {}

$data = json_decode(file_get_contents("php://input"));

$email = !empty($data->email) ? trim($data->email) : '';
$provider = !empty($data->provider) ? trim(strtolower($data->provider)) : 'google';
$providerId = !empty($data->provider_id) ? trim($data->provider_id) : (!empty($data->id) ? trim($data->id) : (!empty($data->sub) ? trim($data->sub) : 'social_' . md5($email)));
$fullName = !empty($data->full_name) ? trim($data->full_name) : (!empty($data->name) ? trim($data->name) : 'User');

if (!empty($email) && !empty($provider)) {
    // Check if user exists by email 
    $query = "SELECT u.id, u.full_name, u.email, u.role, u.status, u.provider, s.id as seller_id 
              FROM users u 
              LEFT JOIN sellers s ON u.id = s.user_id
              WHERE u.email = ? LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        if (isset($user['status']) && $user['status'] == 'blocked') {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Account is blocked"]);
            exit();
        }
        
        // Update provider if empty
        if (empty($user['provider'])) {
            $updateQuery = "UPDATE users SET provider = ? WHERE id = ?";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute([$provider, $user['id']]);
            $user['provider'] = $provider;
        }
    } else {
        // Register new user
        $query = "INSERT INTO users (full_name, email, password, role, provider) VALUES (?, ?, ?, 'user', ?)";
        $stmt = $db->prepare($query);
        $random_password = password_hash(bin2hex(random_bytes(10)), PASSWORD_DEFAULT);

        $stmt->execute([$fullName, $email, $random_password, $provider]);

        $new_id = $db->lastInsertId();
        $user = [
            'id' => $new_id,
            'full_name' => $fullName,
            'email' => $email,
            'role' => 'user',
            'provider' => $provider,
            'seller_id' => null
        ];
    }

    $token_data = [
        "id" => $user['id'],
        "email" => $user['email'],
        "role" => $user['role'],
        "seller_id" => $user['seller_id']
    ];

    $jwt = JWTHelper::generate($token_data);

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Login successful",
        "token" => $jwt,
        "user" => [
            "id" => $user['id'],
            "full_name" => $user['full_name'],
            "email" => $user['email'],
            "role" => $user['role'],
            "seller_id" => $user['seller_id']
        ]
    ]);
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete social data. Email and provider are required."]);
}
?>
