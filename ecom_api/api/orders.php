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

if ($method == 'GET') {
    // Single query fetching all orders AND their items at once — no N+1
    $limitClause = '';
    $whereExtra = '';
    if (isset($_GET['limit']) && is_numeric($_GET['limit']) && (int)$_GET['limit'] > 0) {
        // Use a subquery to limit by order count, not row count (JOIN multiplies rows).
        // MariaDB rejects LIMIT inside an IN subquery (error 1235), so the limited
        // set is materialised in a derived table first.
        $limitCount = (int)$_GET['limit'];
        $whereExtra = " AND o.id IN (SELECT * FROM (SELECT id FROM orders WHERE user_id = :user_id3 ORDER BY created_at DESC LIMIT $limitCount) AS latest_orders)";
    }

    $query = "SELECT 
                o.id, o.user_id, o.total_amount as total, o.discount_amount,
                o.shipping_address, o.payment_method, o.payment_status,
                o.tcs_cn, o.tcs_status, o.cod_paid_status,
                o.order_status as status, o.created_at,
                o.updated_at as delivery_date, o.cancellation_reason,
                u.full_name as customer_name, u.phone as customer_phone,
                p.id as item_product_id, p.name as item_name, p.description as item_description,
                p.category_id as item_category_id, p.stock as item_stock,
                oi.price as item_price, oi.quantity as item_quantity,
                pi.image_url as item_main_image,
                r.rating as user_rating, r.comment as user_comment,
                r.image_url as review_image, r.reply as seller_reply, r.replied_at
              FROM orders o
              JOIN users u ON o.user_id = u.id
              LEFT JOIN order_items oi ON oi.order_id = o.id
              LEFT JOIN products p ON oi.product_id = p.id
              LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
              LEFT JOIN reviews r ON r.product_id = p.id AND r.user_id = :user_id
              WHERE o.user_id = :user_id2" . $whereExtra . "
              ORDER BY o.created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id',  $userId);
    $stmt->bindParam(':user_id2', $userId);
    if (!empty($whereExtra)) {
        $stmt->bindParam(':user_id3', $userId);
    }
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group rows by order id
    $ordersMap = [];
    foreach ($rows as $row) {
        $oid = $row['id'];
        if (!isset($ordersMap[$oid])) {
            $ordersMap[$oid] = [
                'id'                  => $row['id'],
                'user_id'             => $row['user_id'],
                'total'               => $row['total'],
                'discount_amount'     => $row['discount_amount'],
                'shipping_address'    => $row['shipping_address'],
                'payment_method'      => $row['payment_method'],
                'payment_status'      => $row['payment_status'],
                'status'              => $row['status'],
                'created_at'          => $row['created_at'],
                'delivery_date'       => $row['delivery_date'],
                'cancellation_reason' => $row['cancellation_reason'],
                'customer_name'       => $row['customer_name'],
                'customer_phone'      => $row['customer_phone'],
                'items'               => [],
            ];
        }
        if (!empty($row['item_product_id'])) {
            $ordersMap[$oid]['items'][] = [
                'id'           => $row['item_product_id'],
                'name'         => $row['item_name'],
                'description'  => $row['item_description'],
                'category_id'  => $row['item_category_id'],
                'stock'        => $row['item_stock'],
                'price'        => $row['item_price'],
                'quantity'     => $row['item_quantity'],
                'main_image'   => $row['item_main_image'],
                'user_rating'  => $row['user_rating'],
                'user_comment' => $row['user_comment'],
                'review_image' => $row['review_image'],
                'seller_reply' => $row['seller_reply'],
                'replied_at'   => $row['replied_at'],
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "data"   => array_values($ordersMap)
    ]);
} elseif ($method == 'POST') {
    $total = null;
    $address = '';
    $paymentMethod = 'Cash on Delivery';
    $paymentStatus = 'pending';
    $items = [];

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput);

    if ($data && !empty($data->total)) {
        $total = $data->total;
        $address = isset($data->address) ? $data->address : '';
        $paymentMethod = isset($data->payment_method) ? $data->payment_method : 'Cash on Delivery';
        $paymentStatus = isset($data->payment_status) ? $data->payment_status : 'pending';
        $items = isset($data->items) ? $data->items : [];
    } elseif (isset($_POST['total'])) {
        $total = $_POST['total'];
        $address = isset($_POST['address']) ? $_POST['address'] : '';
        $paymentMethod = isset($_POST['payment_method']) ? $_POST['payment_method'] : 'Cash on Delivery';
        $paymentStatus = isset($_POST['payment_status']) ? $_POST['payment_status'] : 'pending';
        if (isset($_POST['items'])) {
            $items = is_string($_POST['items']) ? json_decode($_POST['items']) : $_POST['items'];
        }
    }

    if (!empty($total) && !empty($items)) {
        try {
            $db->beginTransaction();

            // Insert into orders table, supplying all required non-default columns
            $query = "INSERT INTO orders (user_id, total, total_amount, order_status, shipping_address, payment_method, payment_status) 
                      VALUES (:user_id, :total, :total_amount, 'pending', :address, :payment_method, :payment_status)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':total', $total);
            $stmt->bindParam(':total_amount', $total);
            $stmt->bindParam(':address', $address);
            $stmt->bindParam(':payment_method', $paymentMethod);
            $stmt->bindParam(':payment_status', $paymentStatus);
            $stmt->execute();

            $orderId = $db->lastInsertId();

            // Insert items
            foreach ($items as $item) {
                $productId = is_object($item) ? $item->product_id : $item['product_id'];
                $quantity = is_object($item) ? $item->quantity : $item['quantity'];
                $price = is_object($item) ? $item->price : $item['price'];

                $item_query = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (:order_id, :product_id, :quantity, :price)";
                $stmt_item = $db->prepare($item_query);
                $stmt_item->bindParam(':order_id', $orderId);
                $stmt_item->bindParam(':product_id', $productId);
                $stmt_item->bindParam(':quantity', $quantity);
                $stmt_item->bindParam(':price', $price);
                $stmt_item->execute();
            }

            // Clear cart
            $clear_cart = "DELETE FROM cart WHERE user_id = :user_id";
            $stmt_clear = $db->prepare($clear_cart);
            $stmt_clear->bindParam(':user_id', $userId);
            $stmt_clear->execute();

            $db->commit();

            // Real-time notify the shop. Kept OUTSIDE the FCM block so a push
            // failure can never stop the seller dashboard updating live.
            try {
                require_once '../core/socket_helper.php';
                $custQuery = "SELECT full_name FROM users WHERE id = :user_id";
                $cStmt = $db->prepare($custQuery);
                $cStmt->execute([':user_id' => $userId]);
                $customerName = $cStmt->fetchColumn() ?: 'Customer';

                SocketHelper::emit('order_placed', [
                    'orderId' => $orderId,
                    'userId' => $userId,
                    'customerName' => $customerName,
                    'total' => $total,
                    'status' => 'pending',
                    'paymentMethod' => $paymentMethod
                ]);
            } catch (Exception $sockEx) {
                // Ignore socket server connection error
            }

            // --- Notification Logic ---
            try {
                require_once '../core/fcm_helper.php';
                $fcm = new FCMHelper();

                // 1. Notify Customer
                $user_query = "SELECT fcm_token FROM users WHERE id = :user_id";
                $stmt_u = $db->prepare($user_query);
                $stmt_u->bindParam(':user_id', $userId);
                $stmt_u->execute();
                $user_fcm = $stmt_u->fetchColumn();

                if ($user_fcm) {
                    $title = "Order Placed! 🎉";
                    $body = "Your order #$orderId has been placed successfully. Thank you for shopping!";
                    $fcm->sendNotification($user_fcm, $title, $body, ["order_id" => $orderId, "type" => "order_placed"]);
                    $fcm->saveToHistory($db, $userId, $title, $body, "order_placed");
                }

                // 2. Notify Sellers
                $seller_query = "SELECT DISTINCT s.user_id, u.fcm_token 
                                FROM order_items oi 
                                JOIN products p ON oi.product_id = p.id 
                                JOIN sellers s ON p.seller_id = s.id 
                                JOIN users u ON s.user_id = u.id 
                                WHERE oi.order_id = :order_id";
                $stmt_s = $db->prepare($seller_query);
                $stmt_s->bindParam(':order_id', $orderId);
                $stmt_s->execute();
                $sellers = $stmt_s->fetchAll(PDO::FETCH_ASSOC);

                foreach ($sellers as $seller) {
                    if ($seller['fcm_token']) {
                        $title = "New Order Received! 📦";
                        $body = "You've got a new order #$orderId. Check your dashboard for details.";
                        $fcm->sendNotification($seller['fcm_token'], $title, $body, ["order_id" => $orderId, "type" => "new_order"]);
                        $fcm->saveToHistory($db, $seller['user_id'], $title, $body, "new_order");
                    }
                }
            } catch (Exception $e) {
                // Log notification errors but don't fail the order
                error_log("Notification error for order $orderId: " . $e->getMessage());
            }
            // --- End Notification Logic ---

            echo json_encode(["status" => "success", "message" => "Order placed successfully", "order_id" => $orderId]);
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(["status" => "error", "message" => "Failed to place order: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Total and items are required"]);
    }
}
?>