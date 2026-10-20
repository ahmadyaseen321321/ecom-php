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
// Leopards Courier (LCS) Integration
// ================================
// Credentials are read from environment variables first (Apache SetEnv or
// system env), falling back to these constants. Leave LCS_API_KEY empty to
// run in DEMO mode: bookings return simulated Leopards CNs (e.g. LCS88413670),
// tracking advances through realistic checkpoints every 2 hours, and official
// Leopards labels are generated locally. Fill in live keys for real bookings.
define('LCS_API_KEY', '');           // Your Leopards merchant API key
define('LCS_API_PASSWORD', '');      // Your Leopards merchant API password
define('LCS_ENVIRONMENT', 'sandbox');// 'sandbox' = merchantapistaging.leopardscourier.com, 'production' = merchantapi.leopardscourier.com
define('LCS_ORIGIN_CITY_ID', 789);   // Origin city ID from getAllCities (e.g. 789 = Karachi)
define('LCS_DEFAULT_DEST_CITY_ID', 790); // Default destination city ID (e.g. 790 = Lahore)
define('LCS_SHIPPER_NAME', 'My Store');
define('LCS_SHIPPER_EMAIL', 'info@mystore.com');
define('LCS_SHIPPER_PHONE', '03001234567');
define('LCS_SHIPPER_ADDRESS', 'Shop 1, Commercial Market, Karachi');

// Legacy TCS constants (kept for fallback compatibility)
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