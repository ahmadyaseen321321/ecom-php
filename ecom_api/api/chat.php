<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../core/database.php';
$database = new Database();
$db = $database->getConnection();

// Auto-create table if not exists with VARCHAR for order_id
$db->exec("
    CREATE TABLE IF NOT EXISTS order_chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL,
        sender_type ENUM('seller', 'customer') NOT NULL,
        message TEXT NOT NULL,
        attachment_url VARCHAR(255) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

// Modify table strictly in case it was previously generated as INT
try {
    $db->exec("ALTER TABLE order_chats MODIFY order_id VARCHAR(255) NOT NULL");
} catch (Exception $e) { }

// Ensure attachment_url exists if table was created previously without it
try {
    $db->exec("ALTER TABLE order_chats ADD COLUMN attachment_url VARCHAR(255) DEFAULT NULL");
} catch (Exception $e) {
    // Ignore duplicate column errors
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Fetch messages for an order ─────────────────────────────────────────
if ($method === 'GET') {
    $order_id = isset($_GET['order_id']) ? trim($_GET['order_id']) : '';

    if (empty($order_id)) {
        echo json_encode(['status' => 'error', 'message' => 'order_id is required']);
        exit();
    }

    $stmt = $db->prepare("SELECT id, order_id, sender_type, message, attachment_url, created_at FROM order_chats WHERE order_id = ? ORDER BY created_at ASC");
    $stmt->execute([$order_id]);
    $messages = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $messages[] = [
            'id'             => $row['id'],
            'order_id'       => $row['order_id'],
            'sender_type'    => $row['sender_type'],
            'message'        => $row['message'],
            'attachment_url' => $row['attachment_url'],
            'created_at'     => $row['created_at'],
        ];
    }

    echo json_encode(['status' => 'success', 'messages' => $messages]);
    exit();
}

// ── POST: Send a message ──────────────────────────────────────────────────────
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input)) {
        $input = $_POST;
    }

    $order_id    = isset($input['order_id'])    ? trim((string)$input['order_id']) : '';
    $sender_type = isset($input['sender_type']) ? trim($input['sender_type']) : '';
    $message     = isset($input['message'])     ? trim($input['message']) : '';
    $attachment_url = null;

    if (empty($order_id) || empty($sender_type)) {
        echo json_encode(['status' => 'error', 'message' => 'order_id and sender_type are required']);
        exit();
    }
    
    if (empty($message) && empty($_FILES['files']['name'][0])) {
        echo json_encode(['status' => 'error', 'message' => 'message or file is required']);
        exit();
    }

    if (!in_array($sender_type, ['seller', 'customer'])) {
        echo json_encode(['status' => 'error', 'message' => 'sender_type must be seller or customer']);
        exit();
    }

    // Handle file upload
    if (isset($_FILES['files']) && !empty($_FILES['files']['name'][0])) {
        $uploadDir = '../uploads/chats/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileName = time() . '_' . basename($_FILES['files']['name'][0]);
        $targetFilePath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['files']['tmp_name'][0], $targetFilePath)) {
            $attachment_url = 'uploads/chats/' . $fileName;
        }
    }

    $stmt = $db->prepare("INSERT INTO order_chats (order_id, sender_type, message, attachment_url) VALUES (?, ?, ?, ?)");
    
    if ($stmt->execute([$order_id, $sender_type, $message, $attachment_url])) {
        $new_id = $db->lastInsertId();

        // Return the new message
        $fetch = $db->prepare("SELECT id, order_id, sender_type, message, attachment_url, created_at FROM order_chats WHERE id = ?");
        $fetch->execute([$new_id]);
        $row = $fetch->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'status'  => 'success',
            'message' => 'Message sent',
            'data'    => $row,
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to send message']);
    }
    exit();
}

echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
