<?php
// ================================
// Database Configuration (WAMP)
// ================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'ecom_db');   // Change if your database name is different
define('DB_USER', 'root');
define('DB_PASS', '');                   // Default WAMP password is empty

// ================================
// JWT Configuration
// ================================
define('JWT_SECRET', 'your_super_secret_key_here_123456');
define('JWT_ALGO', 'HS256');
define('JWT_EXPIRY', 3600 * 24 * 7); // 7 Days

// ================================
// Project URL
// ================================
// Change "ecom_api" to your project folder name inside www
define('BASE_URL', 'http://localhost/ecom_api/');
define('UPLOAD_DIR', __DIR__ . '/../uploads/');

// ================================
// Firebase Cloud Messaging
// ================================
define('FCM_SERVER_KEY', 'AIzaSyDrRi3Qr1wtNBSWc8XzGVAfBH9RBMAGrYQ');

// ================================
// Error Reporting
// ================================
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ================================
// CORS Headers
// ================================
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle Preflight Request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>