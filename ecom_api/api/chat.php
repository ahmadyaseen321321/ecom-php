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
    // Echoed back over the socket so receivers can match this message with the
    // optimistic bubble the sender already rendered (prevents duplicates)
    $client_id   = isset($input['client_id'])   ? trim((string)$input['client_id']) : '';
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

    // Handle file uploads (images, videos, documents)
    if (isset($_FILES['files'])) {
        // PHP exposes a single upload as SCALARS and multiple uploads as arrays —
        // normalise to arrays so a one-file message is actually saved.
        $fileNames = is_array($_FILES['files']['name'])   ? $_FILES['files']['name']   : [$_FILES['files']['name']];
        $fileTmp   = is_array($_FILES['files']['tmp_name']) ? $_FILES['files']['tmp_name'] : [$_FILES['files']['tmp_name']];
        $fileError = is_array($_FILES['files']['error'])  ? $_FILES['files']['error']  : [$_FILES['files']['error']];
        $fileSize  = is_array($_FILES['files']['size'])   ? $_FILES['files']['size']   : [$_FILES['files']['size']];

        $uploadDir = '../uploads/chats/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $allowedExt  = ['jpg','jpeg','png','gif','webp','avif','bmp','svg','mp4','webm','mov','m4v','avi','mkv','3gp','pdf','doc','docx','txt','zip'];
        $maxBytes    = 50 * 1024 * 1024; // 50 MB per file
        $fileCount   = count($fileNames);
        $savedFiles  = [];
        $uploadErrs  = [];

        for ($i = 0; $i < $fileCount; $i++) {
            if (empty($fileNames[$i])) {
                continue;
            }
            if ((int)$fileError[$i] !== UPLOAD_ERR_OK) {
                $uploadErrs[] = $fileNames[$i] . ' => PHP upload error #' . $fileError[$i];
                continue;
            }

            $originalName = basename($fileNames[$i]);
            $extension    = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            if (!in_array($extension, $allowedExt)) {
                $uploadErrs[] = $originalName . ' => extension not allowed';
                continue;
            }
            if ($fileSize[$i] > $maxBytes) {
                $uploadErrs[] = $originalName . ' => larger than ' . round($maxBytes / 1048576) . 'MB';
                continue;
            }

            $fileName       = time() . '_' . $i . '_' . preg_replace('/[^A-Za-z0-9._-]/', '_', $originalName);
            $targetFilePath = $uploadDir . $fileName;

            if (move_uploaded_file($fileTmp[$i], $targetFilePath)) {
                $savedFiles[] = 'uploads/chats/' . $fileName;
            } else {
                $uploadErrs[] = $originalName . ' => move_uploaded_file failed';
            }
        }

        if (count($uploadErrs) > 0) {
            error_log('[chat.php] attachment upload problem: ' . implode(' | ', $uploadErrs));
        }

        if (count($savedFiles) > 0) {
            $attachment_url = implode(',', $savedFiles);
        }
    }

    // Nothing usable was uploaded (rejected by PHP, extension not allowed,
    // oversized…) — fail loudly instead of storing an empty chat row.
    if (empty($message) && empty($attachment_url)) {
        http_response_code(400);
        $reason = (isset($uploadErrs) && count($uploadErrs) > 0)
            ? implode(' | ', $uploadErrs)
            : 'no valid file was uploaded';
        echo json_encode(['status' => 'error', 'message' => 'File upload failed: ' . $reason]);
        exit();
    }

    $stmt = $db->prepare("INSERT INTO order_chats (order_id, sender_type, message, attachment_url) VALUES (?, ?, ?, ?)");
    
    if ($stmt->execute([$order_id, $sender_type, $message, $attachment_url])) {
        $new_id = $db->lastInsertId();

        $fetch = $db->prepare("SELECT id, order_id, sender_type, message, attachment_url, created_at FROM order_chats WHERE id = ?");
        $fetch->execute([$new_id]);
        $row = $fetch->fetch(PDO::FETCH_ASSOC);

        // Real-Time Socket Event Emission
        try {
            require_once '../core/socket_helper.php';

            // Resolve the order owner so we can target their personal room
            $recipientId   = null;
            $cleanOrderId  = preg_replace('/[^0-9]/', '', $order_id);
            $roomName      = $cleanOrderId !== '' ? 'order_' . $cleanOrderId : 'order_' . $order_id;

            if ($cleanOrderId !== '') {
                try {
                    $oStmt = $db->prepare("SELECT user_id FROM orders WHERE id = :oid");
                    $oStmt->execute([':oid' => $cleanOrderId]);
                    $oRow = $oStmt->fetch(PDO::FETCH_ASSOC);
                    if ($oRow) {
                        $recipientId = $oRow['user_id'];
                    }
                } catch (Exception $orderEx) { }
            }

            SocketHelper::emit('receive_message', [
                'id'            => $client_id !== '' ? $client_id : $row['id'],
                'clientId'      => $client_id !== '' ? $client_id : null,
                'order_id'      => $row['order_id'],
                'orderId'       => $row['order_id'],
                'sender_type'   => $row['sender_type'],
                'senderType'    => $row['sender_type'],
                'sender_name'   => $row['sender_type'] === 'seller' ? 'Store Support' : 'Customer',
                'message'       => $row['message'],
                'text'          => $row['message'],
                'attachment_url'=> $row['attachment_url'],
                'attachmentUrl' => $row['attachment_url'],
                'recipientId'   => $recipientId,
                'created_at'    => $row['created_at'],
                'createdAt'     => $row['created_at']
            ], $roomName);
        } catch (Exception $sockEx) {
            // Ignore socket connection error
        }

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
