<?php
require_once '../core/config.php';
require_once '../core/database.php';
require_once '../core/jwt_helper.php';

// Allow CORS if needed, though config.php likely handles it
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

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->provider) && !empty($data->provider_id)) {
    // Check if user exists by email 
    $query = "SELECT u.id, u.full_name, u.email, u.role, u.status, u.provider, s.id as seller_id 
              FROM users u 
              LEFT JOIN sellers s ON u.id = s.user_id
              WHERE u.email = ? LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute([$data->email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        if ($user['status'] == 'blocked') {
            http_response_code(403);
            echo json_encode(["message" => "Account is blocked"]);
            exit();
        }
        
        // Update provider if it's currently null (if we find an email match but no provider set)
        if (empty($user['provider'])) {
            $updateQuery = "UPDATE users SET provider = ? WHERE id = ?";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute([$data->provider, $user['id']]);
            $user['provider'] = $data->provider;
        }
    }
    else {
        // Register new user
        $query = "INSERT INTO users (full_name, email, password, role, provider) VALUES (?, ?, ?, 'user', ?)";
        $stmt = $db->prepare($query);
        $random_password = password_hash(bin2hex(random_bytes(10)), PASSWORD_DEFAULT);
        $full_name = !empty($data->full_name) ? $data->full_name : 'User';

        $stmt->execute([$full_name, $data->email, $random_password, $data->provider]);

        $new_id = $db->lastInsertId();
        $user = [
            'id' => $new_id,
            'full_name' => $full_name,
            'email' => $data->email,
            'role' => 'user',
            'provider' => $data->provider,
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
}
else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete social data. Email and provider are required."]);
}
?>
