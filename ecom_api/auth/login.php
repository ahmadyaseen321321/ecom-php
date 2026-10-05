<?php
require_once '../core/config.php';
require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    $query = "SELECT u.id, u.full_name, u.email, u.password, u.role, u.status, s.id as seller_id 
              FROM users u 
              LEFT JOIN sellers s ON u.id = s.user_id
              WHERE u.email = ? LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute([$data->email]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($data->password, $user['password'])) {
        if ($user['status'] == 'blocked') {
            http_response_code(403);
            echo json_encode(["message" => "Account is blocked"]);
            exit();
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
    } else {
        http_response_code(401);
        echo json_encode(["message" => "Invalid email or password"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data"]);
}
?>
