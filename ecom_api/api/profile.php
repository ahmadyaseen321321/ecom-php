<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();
$jwtHelper = new JWTHelper();

try {
    $userId = $jwtHelper->validateTokenAndGetUserId();
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized: " . $e->getMessage()]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT id, full_name, email, phone, role, profile_image FROM users WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            echo json_encode($user);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "User not found"]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $fullName = $_POST['full_name'] ?? null;
        $phone = $_POST['phone'] ?? null;
        $profileImage = null;

        // Handle image upload
        if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../uploads/profiles/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileExtension = pathinfo($_FILES['profile_image']['name'], PATHINFO_EXTENSION);
            $fileName = 'profile_' . $userId . '_' . time() . '.' . $fileExtension;
            $targetPath = $uploadDir . $fileName;

            if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $targetPath)) {
                $profileImage = 'uploads/profiles/' . $fileName;
            }
        }

        // Build update query
        $updateFields = [];
        $params = [];

        if ($fullName !== null) {
            $updateFields[] = "full_name = ?";
            $params[] = $fullName;
        }
        if ($phone !== null) {
            $updateFields[] = "phone = ?";
            $params[] = $phone;
        }
        if ($profileImage !== null) {
            $updateFields[] = "profile_image = ?";
            $params[] = $profileImage;
        }

        if (empty($updateFields)) {
            echo json_encode(["message" => "No fields to update"]);
            exit();
        }

        $params[] = $userId;
        $query = "UPDATE users SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute($params)) {
            echo json_encode(["message" => "Profile updated successfully", "profile_image" => $profileImage]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Unable to update profile"]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Server error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
}
?>
