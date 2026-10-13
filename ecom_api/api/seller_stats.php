<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();
$jwtHelper = new JWTHelper();

$userId = $jwtHelper->validateTokenAndGetUserId();
$role = $jwtHelper->getRole();

if (!$userId || ($role != 'seller' && $role != 'admin')) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit();
}

// Get seller_id
$query = "SELECT id FROM sellers WHERE user_id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $userId);
$stmt->execute();
$seller = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$seller) {
    if ($role === 'admin') {
        $seller = $db->query("SELECT id FROM sellers LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    }
}

if (!$seller) {
    echo json_encode([
        "status" => "success",
        "data" => [
            "total_sales" => 0,
            "prev_total_sales" => 0,
            "sales_percentage" => 0,
            "order_count" => 0,
            "product_count" => 0,
            "avg_rating" => 5.0,
            "pending_count" => 0,
            "pending_feedback_count" => 0,
            "confirmed_count" => 0,
            "shipped_count" => 0,
            "delivered_count" => 0,
            "returned_count" => 0,
            "cancelled_count" => 0,
            "chart_data" => []
        ]
    ]);
    exit();
}

$sellerId = $seller['id'];

// Get Days Parameter
$days = isset($_GET['days']) ? (int)$_GET['days'] : 30;

// Get Stats
// 1. Total Sales for this seller's line items in the timeframe.
//    Orders count as soon as they are placed (only cancelled/returned are
//    excluded) so the dashboard moves the moment a seller receives an order,
//    instead of staying at 0 until something is delivered. Line-item revenue is
//    used so multi-item orders are not double counted by the JOIN.
$query = "SELECT COALESCE(SUM(oi.quantity * oi.price), 0) as total_sales FROM orders o 
          JOIN order_items oi ON o.id = oi.order_id 
          JOIN products p ON oi.product_id = p.id 
          WHERE p.seller_id = :seller_id 
          AND o.order_status NOT IN ('cancelled', 'returned')
          AND o.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)";
$stmt = $db->prepare($query);
$stmt->bindParam(':seller_id', $sellerId);
$stmt->bindParam(':days', $days, PDO::PARAM_INT);
$stmt->execute();
$sales = $stmt->fetch(PDO::FETCH_ASSOC);

// 1b. Previous Total Sales (for percentage calculation)
$query = "SELECT COALESCE(SUM(oi.quantity * oi.price), 0) as total_sales FROM orders o 
          JOIN order_items oi ON o.id = oi.order_id 
          JOIN products p ON oi.product_id = p.id 
          WHERE p.seller_id = :seller_id 
          AND o.order_status NOT IN ('cancelled', 'returned')
          AND o.created_at >= DATE_SUB(NOW(), INTERVAL :days2 DAY)
          AND o.created_at < DATE_SUB(NOW(), INTERVAL :days DAY)";
$stmt = $db->prepare($query);
$days2 = $days * 2;
$stmt->bindParam(':seller_id', $sellerId);
$stmt->bindParam(':days', $days, PDO::PARAM_INT);
$stmt->bindParam(':days2', $days2, PDO::PARAM_INT);
$stmt->execute();
$prevSales = $stmt->fetch(PDO::FETCH_ASSOC);

// 2. Order Count (Total in timeframe)
$query = "SELECT COUNT(DISTINCT o.id) as order_count FROM orders o 
          JOIN order_items oi ON o.id = oi.order_id 
          JOIN products p ON oi.product_id = p.id 
          WHERE p.seller_id = :seller_id
          AND o.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)";
$stmt = $db->prepare($query);
$stmt->bindParam(':seller_id', $sellerId);
$stmt->bindParam(':days', $days, PDO::PARAM_INT);
$stmt->execute();
$orders = $stmt->fetch(PDO::FETCH_ASSOC);

// 3. Product Count
$query = "SELECT COUNT(*) as product_count FROM products WHERE seller_id = :seller_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':seller_id', $sellerId);
$stmt->execute();
$products = $stmt->fetch(PDO::FETCH_ASSOC);

// 4. Rating (Average)
$query = "SELECT AVG(rating) as avg_rating FROM reviews r 
          JOIN products p ON r.product_id = p.id 
          WHERE p.seller_id = :seller_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':seller_id', $sellerId);
$stmt->execute();
$rating = $stmt->fetch(PDO::FETCH_ASSOC);

// 5. Order Status Counts (in timeframe)
$query = "SELECT 
            SUM(CASE WHEN LOWER(o.order_status) IN ('pending', 'processing') THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN LOWER(o.order_status) IN ('confirmed', 'in progress', 'in_progress') THEN 1 ELSE 0 END) as confirmed_count,
            SUM(CASE WHEN LOWER(o.order_status) = 'shipped' THEN 1 ELSE 0 END) as shipped_count,
            SUM(CASE WHEN LOWER(o.order_status) = 'delivered' THEN 1 ELSE 0 END) as delivered_count,
            SUM(CASE WHEN LOWER(o.order_status) IN ('returned', 'returns') THEN 1 ELSE 0 END) as returned_count,
            SUM(CASE WHEN LOWER(o.order_status) = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
          FROM orders o 
          JOIN order_items oi ON o.id = oi.order_id 
          JOIN products p ON oi.product_id = p.id 
          WHERE p.seller_id = :seller_id
          AND o.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)";
$stmt = $db->prepare($query);
$stmt->bindParam(':seller_id', $sellerId);
$stmt->bindParam(':days', $days, PDO::PARAM_INT);
$stmt->execute();
$statusCounts = $stmt->fetch(PDO::FETCH_ASSOC);

// 6. Chart Data (Daily Revenue - Continuous Timeline)
$chartDataRaw = [];
for ($i = $days - 1; $i >= 0; $i--) {
    $dateStr = date('Y-m-d', strtotime("-$i days"));
    $label = date('M d', strtotime("-$i days"));
    $chartDataRaw[$dateStr] = [
        "label" => $label,
        "value" => 0.0
    ];
}

$query = "SELECT DATE(o.created_at) as date_val, SUM(oi.quantity * oi.price) as total_value 
          FROM orders o 
          JOIN order_items oi ON o.id = oi.order_id 
          JOIN products p ON oi.product_id = p.id 
          WHERE p.seller_id = :seller_id 
          AND o.order_status NOT IN ('cancelled', 'returned')
          AND DATE(o.created_at) > DATE_SUB(CURDATE(), INTERVAL :days DAY)
          GROUP BY DATE(o.created_at)
          ORDER BY DATE(o.created_at) ASC";
$stmt = $db->prepare($query);
$stmt->bindParam(':seller_id', $sellerId);
$stmt->bindParam(':days', $days, PDO::PARAM_INT);
$stmt->execute();
$dbResults = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($dbResults as $row) {
    if (isset($chartDataRaw[$row['date_val']])) {
        $chartDataRaw[$row['date_val']]['value'] = (float)$row['total_value'];
    }
}

$chartData = array_values($chartDataRaw);

// Calculate Percentages
$currSales = (float)($sales['total_sales'] ?? 0);
$oldSales = (float)($prevSales['total_sales'] ?? 0);
$salesPct = $oldSales > 0 ? (($currSales - $oldSales) / $oldSales) * 100 : 0;

// 7. Pending Feedback Count (Reviews without replies)
$query = "SELECT COUNT(*) as pending_feedback FROM reviews r 
          JOIN products p ON r.product_id = p.id 
          WHERE p.seller_id = :seller_id AND (r.reply IS NULL OR r.reply = '')";
$stmt = $db->prepare($query);
$stmt->bindParam(':seller_id', $sellerId);
$stmt->execute();
$feedbackStats = $stmt->fetch(PDO::FETCH_ASSOC);

// 8. Sales by category in the timeframe (drives the pie chart)
$query = "SELECT COALESCE(c.name, 'Uncategorized') as name,
            COALESCE(SUM(oi.quantity), 0) as units,
            COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          JOIN products p ON oi.product_id = p.id
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.seller_id = :seller_id
          AND o.order_status NOT IN ('cancelled', 'returned')
          AND o.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
          GROUP BY c.id, c.name
          HAVING revenue > 0
          ORDER BY revenue DESC";
$stmt = $db->prepare($query);
$stmt->bindParam(':seller_id', $sellerId);
$stmt->bindParam(':days', $days, PDO::PARAM_INT);
$stmt->execute();
$categorySales = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 9. Monthly goal metrics — this calendar month vs the previous one
$monthStart = date('Y-m-01 00:00:00');
$prevMonthStart = date('Y-m-01 00:00:00', strtotime('-1 month'));
// Derived from the 1st so month-end dates (Jan 31) never roll two months forward
$nextMonthStart = date('Y-m-01 00:00:00', strtotime($monthStart . ' +1 month'));

$monthlyQuery = "SELECT
    COALESCE(SUM(CASE WHEN o.created_at >= :m_start AND o.created_at < :m_end
                      THEN oi.quantity * oi.price END), 0) as month_revenue,
    COALESCE(SUM(CASE WHEN o.created_at >= :p_start AND o.created_at < :p_end
                      THEN oi.quantity * oi.price END), 0) as prev_month_revenue
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  JOIN products p ON oi.product_id = p.id
  WHERE p.seller_id = :seller_id
  AND o.order_status NOT IN ('cancelled', 'returned')
  AND o.created_at >= :p_start2";
$stmt = $db->prepare($monthlyQuery);
$stmt->bindParam(':seller_id', $sellerId);
$stmt->bindParam(':m_start', $monthStart);
$stmt->bindParam(':m_end', $nextMonthStart);
$stmt->bindParam(':p_start', $prevMonthStart);
$stmt->bindParam(':p_end', $monthStart);
$stmt->bindParam(':p_start2', $prevMonthStart);
$stmt->execute();
$monthly = $stmt->fetch(PDO::FETCH_ASSOC);

// New customers = buyers whose FIRST order with this seller falls in the month
$newCustQuery = "SELECT COUNT(*) as cnt FROM (
    SELECT o.user_id
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE p.seller_id = :seller_id
    AND o.order_status NOT IN ('cancelled', 'returned')
    GROUP BY o.user_id
    HAVING MIN(o.created_at) >= :m_start AND MIN(o.created_at) < :m_end
  ) t";
$monthMetrics = ['month_new_customers' => 0, 'prev_month_new_customers' => 0];
foreach ([['m_start' => $monthStart, 'm_end' => $nextMonthStart, 'key' => 'month_new_customers'],
          ['m_start' => $prevMonthStart, 'm_end' => $monthStart, 'key' => 'prev_month_new_customers']] as $range) {
    $rStart = $range['m_start'];
    $rEnd = $range['m_end'];
    $stmt = $db->prepare($newCustQuery);
    $stmt->bindParam(':seller_id', $sellerId);
    $stmt->bindParam(':m_start', $rStart);
    $stmt->bindParam(':m_end', $rEnd);
    $stmt->execute();
    $monthMetrics[$range['key']] = (int) $stmt->fetchColumn();
}

echo json_encode([
    "status" => "success",
    "data" => [
        "total_sales" => $currSales,
        "prev_total_sales" => $oldSales,
        "sales_percentage" => round($salesPct, 1),
        "order_count" => (int) $orders['order_count'],
        "product_count" => (int) $products['product_count'],
        "avg_rating" => round((float) ($rating['avg_rating'] ?? 0), 1),
        "pending_count" => (int) ($statusCounts['pending_count'] ?? 0),
        "pending_feedback_count" => (int) ($feedbackStats['pending_feedback'] ?? 0),
        "confirmed_count" => (int) ($statusCounts['confirmed_count'] ?? 0),
        "shipped_count" => (int) ($statusCounts['shipped_count'] ?? 0),
        "delivered_count" => (int) ($statusCounts['delivered_count'] ?? 0),
        "returned_count" => (int) ($statusCounts['returned_count'] ?? 0),
        "cancelled_count" => (int) ($statusCounts['cancelled_count'] ?? 0),
        "chart_data" => $chartData,
        "category_sales" => array_map(function ($r) {
            return [
                "name" => $r['name'],
                "units" => (int) $r['units'],
                "revenue" => (float) $r['revenue']
            ];
        }, $categorySales),
        "month_revenue" => round((float) ($monthly['month_revenue'] ?? 0), 2),
        "prev_month_revenue" => round((float) ($monthly['prev_month_revenue'] ?? 0), 2),
        "month_new_customers" => $monthMetrics['month_new_customers'],
        "prev_month_new_customers" => $monthMetrics['prev_month_new_customers']
    ]
]);

?>