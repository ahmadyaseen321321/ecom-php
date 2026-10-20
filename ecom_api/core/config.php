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
// TCS Courier Integration
// ================================
// Credentials are read from environment variables first (Apache SetEnv or
// system env), falling back to these constants. Leave them empty to run the
// integration in DEMO mode: bookings return simulated CNs, tracking advances
// through realistic checkpoints every 2 hours, and labels/invoices are
// generated locally. Fill them in and the same code talks to real TCS.
define('TCS_CLIENT_ID', 'a4d357ba-073c-4282-84b8-56b457969248');
define('TCS_CLIENT_SECRET', ''); // Click "View Subscription" in TCS portal to copy your Secret/Key
define('TCS_USERNAME', '');      // Your TCS portal login email/username
define('TCS_PASSWORD', '');      // Your TCS portal login password
define('TCS_ENVIRONMENT', 'sandbox');     // 'sandbox' = devconnect.tcscourier.com, 'production' = ociconnect.tcscourier.com
define('TCS_SERVICE_CODE', 'OVERNIGHT');  // confirm the service code list with TCS
define('TCS_COST_CENTER_CODE', '');       // pickup cost centre provided by TCS (leave empty or fill from TCS)
define('TCS_DEFAULT_CITY', 'KARACHI');

// ================================
// Stripe Payment Gateway
// ================================
// Credentials are read from environment variables first (Apache SetEnv or
// system env), falling back to these constants. Leave STRIPE_SECRET_KEY empty
// to run the gateway in DEMO mode: checkout uses a local card-entry step with
// Stripe's test card numbers (4242 4242 4242 4242 succeeds, 4000 0000 0000 0002
// declines) and orders are marked paid instantly. Fill in your live keys and the
// same code redirects buyers to Stripe's real hosted checkout page.
define('STRIPE_SECRET_KEY', 'sk_test_51USGuHGzEFXhl8uCmwgYQTOrkEbkE07K7o7sWAk7mYUU5OopMCWkqBMFL9fxK7IBqhytQZScNCs9l22e3PEVYf9R00XzyztajX');
define('STRIPE_PUBLISHABLE_KEY', 'pk_test_51USGuHGzEFXhl8uCzaLkGxw9RHDRboiF10rTWKUDcmIOhhBvVUw1aOfaQoMEWKePjCocqAkchvEGsRZmjzDtRouZ00dda2j0gH');
define('STRIPE_WEBHOOK_SECRET', '');     // whsec_... (optional for local testing, or use Stripe CLI)
define('STRIPE_CURRENCY', 'pkr');        // ISO currency code — PKR uses paisa (100 = Rs. 1)

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