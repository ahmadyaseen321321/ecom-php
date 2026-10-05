<?php
require_once '../core/config.php';
require_once '../core/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->full_name) && !empty($data->email) && !empty($data->password)) {
    // Check if user exists
    $query = "SELECT id FROM users WHERE email = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$data->email]);

    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["message" => "Email already registered"]);
        exit();
    }

    // Hash password
    $password_hash = password_hash($data->password, PASSWORD_BCRYPT);

    $query = "INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)";
    $stmt = $db->prepare($query);

    $role = !empty($data->role) ? $data->role : 'user';

    if ($stmt->execute([$data->full_name, $data->email, $data->phone ?? null, $password_hash, $role])) {
        // If role is seller, create seller entry
        if ($role == 'seller') {
            $user_id = $db->lastInsertId();
            $query = "INSERT INTO sellers (user_id, shop_name) VALUES (?, ?)";
            $stmt = $db->prepare($query);
            $stmt->execute([$user_id, $data->shop_name ?? $data->full_name . "'s Shop"]);
        }

        http_response_code(201);
        echo json_encode(["message" => "User registered successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Unable to register user"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data"]);
}
?>
