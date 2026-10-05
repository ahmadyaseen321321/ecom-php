<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();
$jwtHelper = new JWTHelper();

$userId = $jwtHelper->validateTokenAndGetUserId();

if (!$userId) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : 'tickets';

if ($method == 'GET') {
    if ($action == 'tickets') {
        // List tickets for the user
        $query = "SELECT * FROM support_tickets WHERE user_id = :user_id ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => $tickets]);
    } elseif ($action == 'messages') {
        // List messages for a specific ticket
        $ticket_id = isset($_GET['ticket_id']) ? $_GET['ticket_id'] : null;
        if ($ticket_id) {
            $query = "SELECT * FROM chats WHERE ticket_id = :ticket_id ORDER BY created_at ASC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':ticket_id', $ticket_id);
            $stmt->execute();
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["status" => "success", "data" => $messages]);
        }
    }
} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if ($action == 'create_ticket') {
        if (!empty($data->subject)) {
            $query = "INSERT INTO support_tickets (user_id, subject) VALUES (:user_id, :subject)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':subject', $data->subject);
            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Ticket created", "ticket_id" => $db->lastInsertId()]);
            } else {
                echo json_encode(["status" => "error", "message" => "Failed to create ticket"]);
            }
        }
    } elseif ($action == 'send_message') {
        if (!empty($data->ticket_id) && !empty($data->message)) {
            // In a real app, receiver_id would be the admin or seller. 
            // For now, let's assume receiver_id 1 is the admin.
            $receiver_id = 1; 
            $query = "INSERT INTO chats (ticket_id, sender_id, receiver_id, message) VALUES (:ticket_id, :sender_id, :receiver_id, :message)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':ticket_id', $data->ticket_id);
            $stmt->bindParam(':sender_id', $userId);
            $stmt->bindParam(':receiver_id', $receiver_id);
            $stmt->bindParam(':message', $data->message);
            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Message sent"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Failed to send message"]);
            }
        }
    }
}
?>
