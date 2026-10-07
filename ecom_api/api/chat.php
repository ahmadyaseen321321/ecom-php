<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();
$jwtHelper = new JWTHelper();

// Auto-create table if not exists
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

try {
    $db->exec("ALTER TABLE order_chats MODIFY order_id VARCHAR(255) NOT NULL");
} catch (Exception $e) { }

try {
    $db->exec("ALTER TABLE order_chats ADD COLUMN attachment_url VARCHAR(255) DEFAULT NULL");
} catch (Exception $e) { }

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Fetch messages for an order OR list of conversations ───────────────
if ($method === 'GET') {
    $order_id = isset($_GET['order_id']) ? trim($_GET['order_id']) : '';

    // If a specific order_id is requested, return its messages
    if (!empty($order_id)) {
        // Clean prefix if any
        $cleanId = preg_replace('/[^0-9]/', '', $order_id);
        
        $stmt = $db->prepare("SELECT id, order_id, sender_type, message, attachment_url, created_at 
                              FROM order_chats 
                              WHERE order_id = :oid1 OR order_id = :oid2 
                              ORDER BY created_at ASC");
        $stmt->execute([':oid1' => $order_id, ':oid2' => $cleanId]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'messages' => $messages, 'data' => $messages]);
        exit();
    }

    // Otherwise, return all active conversations for the seller/admin
    $userId = $jwtHelper->validateTokenAndGetUserId();
    $seller = null;
    if ($userId) {
        $sStmt = $db->prepare("SELECT id FROM sellers WHERE user_id = :uid");
        $sStmt->execute([':uid' => $userId]);
        $seller = $sStmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Fetch recent orders with customer names to build conversation list
    $ordersQuery = "SELECT 
                        o.id,
                        o.order_status,
                        o.total_amount,
                        o.created_at,
                        u.full_name as customer_name,
                        u.email as customer_email,
                        (SELECT message FROM order_chats WHERE order_id = CONCAT('#ORD-', o.id) OR order_id = CAST(o.id AS CHAR) ORDER BY id DESC LIMIT 1) as last_message,
                        (SELECT created_at FROM order_chats WHERE order_id = CONCAT('#ORD-', o.id) OR order_id = CAST(o.id AS CHAR) ORDER BY id DESC LIMIT 1) as last_message_time,
                        (SELECT (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1)
                         FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id LIMIT 1) as product_image
                    FROM orders o
                    LEFT JOIN users u ON o.user_id = u.id
                    ORDER BY o.created_at DESC
                    LIMIT 20";
                    
    $stmt = $db->query($ordersQuery);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $conversations = [];
    foreach ($rows as $row) {
        $customerName = $row['customer_name'] ?: 'Customer #' . $row['id'];
        $initials = strtoupper(substr($customerName, 0, 2));
        
        $conversations[] = [
            'id' => (string)$row['id'],
            'orderId' => '#ORD-' . $row['id'],
            'name' => $customerName,
            'avatarText' => $initials,
            'avatarImg' => $row['product_image'],
            'image' => $row['product_image'],
            'online' => true,
            'time' => $row['last_message_time'] ? date('h:i A', strtotime($row['last_message_time'])) : date('M j', strtotime($row['created_at'])),
            'preview' => $row['last_message'] ?: 'Order placed: Total Rs. ' . number_format((float)$row['total_amount'], 2),
            'unread' => false,
            'status' => $row['order_status']
        ];
    }

    echo json_encode(['status' => 'success', 'conversations' => $conversations, 'data' => $conversations]);
    exit();
}

// ── POST: Send a message ──────────────────────────────────────────────────────
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input)) {
        $input = $_POST;
    }

    $order_id    = isset($input['order_id'])    ? trim((string)$input['order_id']) : '';
    $sender_type = isset($input['sender_type']) ? trim($input['sender_type']) : 'seller';
    $message     = isset($input['message'])     ? trim($input['message']) : '';
    $attachment_url = null;

    if (empty($order_id)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'order_id is required']);
        exit();
    }
    
    if (empty($message) && empty($_FILES['files']['name'][0])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'message or file is required']);
        exit();
    }

    if (!in_array($sender_type, ['seller', 'customer'])) {
        $sender_type = 'seller';
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

        $fetch = $db->prepare("SELECT id, order_id, sender_type, message, attachment_url, created_at FROM order_chats WHERE id = ?");
        $fetch->execute([$new_id]);
        $row = $fetch->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'status'  => 'success',
            'message' => 'Message sent',
            'data'    => $row,
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to send message']);
    }
    exit();
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
?>
