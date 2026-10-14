<?php
// Detailed drill-down analytics for the seller dashboard KPI cards.
// GET /api/seller_analytics.php?days=30
// Returns order-value distribution, per-day series, payment/status splits,
// top orders, top products by revenue, and new-vs-returning customers.
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

if (!$seller && $role === 'admin') {
    $seller = $db->query("SELECT id FROM sellers LIMIT 1")->fetch(PDO::FETCH_ASSOC);
}

if (!$seller) {
    echo json_encode(["status" => "success", "data" => [
        "value_distribution" => [], "orders_by_day" => [], "orders_by_payment" => [],
        "orders_by_status" => [], "top_orders" => [], "aov_trend" => [],
        "new_vs_returning" => ["new" => 0, "returning" => 0],
        "top_products_revenue" => [], "revenue_by_day" => [],
        "summary" => []
    ]]);
    exit();
}

$sellerId = $seller['id'];
$days = isset($_GET['days']) ? (int)$_GET['days'] : 30;
if ($days < 1) $days = 30;

// Common FROM clause: this seller's line items, revenue counts as placed
// (cancelled/returned excluded) to stay consistent with the overview cards.
$fromClause = "FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    LEFT JOIN users ub ON o.user_id = ub.id
    WHERE p.seller_id = :seller_id
    AND o.order_status NOT IN ('cancelled', 'returned')
    AND o.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)";

// 1. Per-order totals for the period (base for distribution / top orders / AOV)
$orderTotalsQuery = "SELECT o.id, o.payment_method, o.order_status, o.created_at,
        ub.full_name as customer_name,
        SUM(oi.quantity * oi.price) as order_total,
        SUM(oi.quantity) as item_count
    " . $fromClause . "
    GROUP BY o.id, o.payment_method, o.order_status, o.created_at, ub.full_name
    ORDER BY order_total DESC";
$stmt = $db->prepare($orderTotalsQuery);
$stmt->bindParam(':seller_id', $sellerId);
$stmt->bindParam(':days', $days, PDO::PARAM_INT);
$stmt->execute();
$orderTotals = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 1a. Also fetch user_id per order for new-vs-returning (needs unfiltered statuses
//     so a returning customer's cancelled order still marks them as known)
$userOrdersQuery = "SELECT o.id, o.user_id, o.created_at
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE p.seller_id = :seller_id
    AND o.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
    GROUP BY o.id, o.user_id, o.created_at";
$stmt = $db->prepare($userOrdersQuery);
$stmt->bindParam(':seller_id', $sellerId);
$stmt->bindParam(':days', $days, PDO::PARAM_INT);
$stmt->execute();
$userOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 2. Value distribution buckets
$buckets = [
    ['label' => 'Under Rs. 100', 'min' => 0, 'max' => 100, 'count' => 0, 'revenue' => 0],
    ['label' => 'Rs. 100 - 500', 'min' => 100, 'max' => 500, 'count' => 0, 'revenue' => 0],
    ['label' => 'Rs. 500 - 1,000', 'min' => 500, 'max' => 1000, 'count' => 0, 'revenue' => 0],
    ['label' => 'Rs. 1,000 - 5,000', 'min' => 1000, 'max' => 5000, 'count' => 0, 'revenue' => 0],
    ['label' => 'Rs. 5,000+', 'min' => 5000, 'max' => PHP_FLOAT_MAX, 'count' => 0, 'revenue' => 0],
];
$paymentCounts = [];
$statusCounts = [];
$dayTotals = []; // date => ['orders' => n, 'revenue' => x]
$orderValues = [];

foreach ($orderTotals as $row) {
    $total = (float)$row['order_total'];
    $orderValues[] = $total;
    foreach ($buckets as $i => $b) {
        if ($total >= $b['min'] && $total < $b['max']) {
            $buckets[$i]['count']++;
            $buckets[$i]['revenue'] += $total;
            break;
        }
    }
    $pm = $row['payment_method'] ?: 'Other';
    $paymentCounts[$pm] = ($paymentCounts[$pm] ?? 0) + 1;
    $st = strtolower($row['order_status'] ?: 'pending');
    $statusCounts[$st] = ($statusCounts[$st] ?? 0) + 1;
    $day = substr($row['created_at'], 0, 10);
    if (!isset($dayTotals[$day])) $dayTotals[$day] = ['orders' => 0, 'revenue' => 0.0];
    $dayTotals[$day]['orders']++;
    $dayTotals[$day]['revenue'] += $total;
}

// Continuous daily series (zero-filled) for charts
$ordersByDay = [];
$aovTrend = [];
$revenueByDay = [];
for ($i = $days - 1; $i >= 0; $i--) {
    $dateStr = date('Y-m-d', strtotime("-$i days"));
    $label = date('M d', strtotime("-$i days"));
    $d = $dayTotals[$dateStr] ?? ['orders' => 0, 'revenue' => 0.0];
    $ordersByDay[] = ['label' => $label, 'value' => $d['orders']];
    $revenueByDay[] = ['label' => $label, 'value' => round($d['revenue'], 2)];
    $aovTrend[] = ['label' => $label, 'value' => $d['orders'] > 0 ? round($d['revenue'] / $d['orders'], 2) : 0];
}

// Median & summary from order values
$summary = ['total_orders' => count($orderValues), 'total_revenue' => 0, 'aov' => 0, 'median' => 0, 'highest' => 0, 'lowest' => 0];
if (count($orderValues) > 0) {
    $sum = array_sum($orderValues);
    $sorted = $orderValues;
    sort($sorted);
    $n = count($sorted);
    $mid = intdiv($n, 2);
    $summary['total_revenue'] = round($sum, 2);
    $summary['aov'] = round($sum / $n, 2);
    $summary['median'] = ($n % 2) ? round($sorted[$mid], 2) : round(($sorted[$mid - 1] + $sorted[$mid]) / 2, 2);
    $summary['highest'] = round($sorted[$n - 1], 2);
    $summary['lowest'] = round($sorted[0], 2);
    $best = null; $bestRevenue = -1;
    foreach ($dayTotals as $d => $v) {
        if ($v['revenue'] > $bestRevenue) { $bestRevenue = $v['revenue']; $best = $d; }
    }
    $summary['best_day'] = $best ? date('M d', strtotime($best)) : '—';
    $summary['best_day_revenue'] = round($bestRevenue, 2);
    $summary['avg_per_day_orders'] = round($n / max(1, $days), 1);
}

// Top 5 orders by value
$topOrders = [];
foreach (array_slice($orderTotals, 0, 5) as $row) {
    $topOrders[] = [
        'id' => (int)$row['id'],
        'customer_name' => $row['customer_name'],
        'total' => round((float)$row['order_total'], 2),
        'items' => (int)$row['item_count'],
        'status' => $row['order_status'],
        'created_at' => $row['created_at']
    ];
}

// 3. New vs returning customers in the period
$firstOrderQuery = "SELECT o.user_id, MIN(o.created_at) as first_order
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE p.seller_id = :seller_id
    GROUP BY o.user_id";
$stmt = $db->prepare($firstOrderQuery);
$stmt->bindParam(':seller_id', $sellerId);
$stmt->execute();
$firstOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);
$firstMap = [];
foreach ($firstOrders as $fo) {
    $firstMap[$fo['user_id']] = $fo['first_order'];
}
$periodStart = date('Y-m-d H:i:s', strtotime("-$days days"));
$newCount = 0; $returningCount = 0; $seenUsers = [];
foreach ($userOrders as $uo) {
    $uid = $uo['user_id'];
    if (isset($seenUsers[$uid])) continue;
    $seenUsers[$uid] = true;
    if (($firstMap[$uid] ?? $uo['created_at']) >= $periodStart) $newCount++;
    else $returningCount++;
}

// 4. Top products by revenue in the period
$topProductsQuery = "SELECT p.id, p.name,
        COALESCE(SUM(oi.quantity), 0) as units,
        COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE p.seller_id = :seller_id
    AND o.order_status NOT IN ('cancelled', 'returned')
    AND o.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
    GROUP BY p.id, p.name
    HAVING revenue > 0
    ORDER BY revenue DESC
    LIMIT 5";
$stmt = $db->prepare($topProductsQuery);
$stmt->bindParam(':seller_id', $sellerId);
$stmt->bindParam(':days', $days, PDO::PARAM_INT);
$stmt->execute();
$topProducts = array_map(function ($r) {
    return [
        'id' => (int)$r['id'],
        'name' => $r['name'],
        'units' => (int)$r['units'],
        'revenue' => round((float)$r['revenue'], 2)
    ];
}, $stmt->fetchAll(PDO::FETCH_ASSOC));

echo json_encode([
    "status" => "success",
    "data" => [
        "days" => $days,
        "summary" => $summary,
        "value_distribution" => array_map(function ($b) {
            return ['label' => $b['label'], 'count' => $b['count'], 'revenue' => round($b['revenue'], 2)];
        }, $buckets),
        "orders_by_day" => $ordersByDay,
        "revenue_by_day" => $revenueByDay,
        "aov_trend" => $aovTrend,
        "orders_by_payment" => array_map(function ($k, $v) {
            return ['label' => $k, 'count' => $v];
        }, array_keys($paymentCounts), array_values($paymentCounts)),
        "orders_by_status" => array_map(function ($k, $v) {
            return ['label' => $k, 'count' => $v];
        }, array_keys($statusCounts), array_values($statusCounts)),
        "top_orders" => $topOrders,
        "new_vs_returning" => ["new" => $newCount, "returning" => $returningCount],
        "top_products_revenue" => $topProducts
    ]
]);
?>
