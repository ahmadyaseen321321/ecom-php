<?php
// Homepage promotional banners (2 slots: 1 = hero, 2 = promo).
// GET    — public: list banners
// POST   — seller/admin: upsert a banner slot (multipart, optional image file)
// DELETE — seller/admin: clear a banner slot (?slot=N) — storefront falls back to default design
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

require_once '../core/database.php';
require_once '../core/jwt_helper.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    exit();
}

// ─── GET: public listing ─────────────────────────────────────────────
if ($method == 'GET') {
    $query = "SELECT * FROM banners ORDER BY slot ASC, id ASC";
    $stmt = $db->prepare($query);
    $stmt->execute();

    echo json_encode([
        "status" => "success",
        "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);
    exit();
}

// ─── Mutations require a seller/admin JWT ────────────────────────────
$jwtHelper = new JWTHelper();
$userId = $jwtHelper->validateTokenAndGetUserId();
$role = $jwtHelper->getRole();

if (!$userId || ($role != 'seller' && $role != 'admin')) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

// ─── DELETE: clear a banner slot ─────────────────────────────────────
if ($method == 'DELETE') {
    $slot = isset($_GET['slot']) ? (int)$_GET['slot'] : 0;
    if ($slot < 1 || $slot > 2) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Valid slot (1 or 2) required"]);
        exit();
    }

    $stmt = $db->prepare("DELETE FROM banners WHERE slot = :slot");
    $stmt->bindParam(':slot', $slot, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode(["status" => "success", "message" => "Banner cleared"]);
    exit();
}

// ─── POST: upsert a banner slot (multipart) ──────────────────────────
if ($method == 'POST') {
    $slot = isset($_POST['slot']) ? (int)$_POST['slot'] : 0;
    if ($slot < 1 || $slot > 2) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Valid slot (1 or 2) required"]);
        exit();
    }

    $badge     = isset($_POST['badge_text']) ? trim($_POST['badge_text']) : '';
    $title     = isset($_POST['title']) ? trim($_POST['title']) : '';
    $subtitle  = isset($_POST['subtitle']) ? trim($_POST['subtitle']) : '';
    $button    = isset($_POST['button_text']) ? trim($_POST['button_text']) : '';
    $linkType  = isset($_POST['link_type']) ? trim($_POST['link_type']) : 'none';
    $productId = !empty($_POST['product_id']) ? (int)$_POST['product_id'] : null;
    $link      = isset($_POST['link']) ? trim($_POST['link']) : '';
    $clearImg  = isset($_POST['clear_image']) && $_POST['clear_image'] == '1';

    if ($title === '') {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Headline is required for a banner"]);
        exit();
    }
    if (!in_array($linkType, ['none', 'product', 'url'])) {
        $linkType = 'none';
    }
    if ($linkType === 'product') {
        if (!$productId) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Pick a product for the button link"]);
            exit();
        }
        $chk = $db->prepare("SELECT id FROM products WHERE id = :id AND status != 'deleted'");
        $chk->bindParam(':id', $productId, PDO::PARAM_INT);
        $chk->execute();
        if (!$chk->fetch()) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Selected product no longer exists"]);
            exit();
        }
    }
    if ($linkType === 'url' && $link === '') {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Enter a URL for the button link"]);
        exit();
    }

    // Existing row for this slot (keeps current image when no new file is sent)
    $stmt = $db->prepare("SELECT * FROM banners WHERE slot = :slot LIMIT 1");
    $stmt->bindParam(':slot', $slot, PDO::PARAM_INT);
    $stmt->execute();
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    $currentImage = $existing ? $existing['image_url'] : null;

    // Optional image upload
    $imageUrl = $currentImage;
    if (isset($_FILES['image']) && (int)$_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $originalName = basename($_FILES['image']['name']);
        $extension    = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $allowedExt   = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $maxBytes     = 8 * 1024 * 1024; // 8 MB

        if (!in_array($extension, $allowedExt)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Banner image must be PNG, JPG, WEBP or GIF"]);
            exit();
        }
        if ((int)$_FILES['image']['size'] > $maxBytes) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Banner image must be smaller than 8MB"]);
            exit();
        }

        // Validate aspect ratio and dimensions for wide banner (3:1 ratio required, e.g. 1200x400 or 1500x500)
        $imgInfo = @getimagesize($_FILES['image']['tmp_name']);
        if (!$imgInfo) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Invalid image file uploaded"]);
            exit();
        }
        $imgW = (int)$imgInfo[0];
        $imgH = (int)$imgInfo[1];
        if ($imgW < 900 || $imgH < 250) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Banner image resolution too low ({$imgW}x{$imgH}). Minimum required is 1000px wide by 300px tall."]);
            exit();
        }
        $imgRatio = $imgW / max(1, $imgH);
        if ($imgRatio < 2.5 || $imgRatio > 3.5) {
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "message" => "Invalid image aspect ratio (" . round($imgRatio, 2) . ":1). Banner requires approximately 3:1 panoramic ratio (e.g. 1200x400 or 1500x500). Current: {$imgW}x{$imgH}."
            ]);
            exit();
        }

        $uploadDir = '../uploads/banners/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileName       = 'banner_' . $slot . '_' . time() . '_' . preg_replace('/[^A-Za-z0-9._-]/', '_', $originalName);
        $targetFilePath = $uploadDir . $fileName;

        if (!move_uploaded_file($_FILES['image']['tmp_name'], $targetFilePath)) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Could not save the uploaded banner image"]);
            exit();
        }
        $imageUrl = 'uploads/banners/' . $fileName;
    } else if ($clearImg) {
        $imageUrl = null;
    }

    if ($existing) {
        $query = "UPDATE banners SET image_url = :image, badge_text = :badge, title = :title,
                  subtitle = :subtitle, button_text = :button, link_type = :ltype,
                  product_id = :pid, link = :link WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':image', $imageUrl);
        $stmt->bindParam(':badge', $badge);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':subtitle', $subtitle);
        $stmt->bindParam(':button', $button);
        $stmt->bindParam(':ltype', $linkType);
        $stmt->bindParam(':pid', $productId, $productId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->bindParam(':link', $link);
        $stmt->bindParam(':id', $existing['id'], PDO::PARAM_INT);
        $stmt->execute();
        $bannerId = (int)$existing['id'];
    } else {
        $query = "INSERT INTO banners (slot, image_url, badge_text, title, subtitle, button_text, link_type, product_id, link)
                  VALUES (:slot, :image, :badge, :title, :subtitle, :button, :ltype, :pid, :link)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':slot', $slot, PDO::PARAM_INT);
        $stmt->bindParam(':image', $imageUrl);
        $stmt->bindParam(':badge', $badge);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':subtitle', $subtitle);
        $stmt->bindParam(':button', $button);
        $stmt->bindParam(':ltype', $linkType);
        $stmt->bindParam(':pid', $productId, $productId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->bindParam(':link', $link);
        $stmt->execute();
        $bannerId = (int)$db->lastInsertId();
    }

    $stmt = $db->prepare("SELECT * FROM banners WHERE id = :id");
    $stmt->bindParam(':id', $bannerId, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode([
        "status" => "success",
        "message" => "Banner saved",
        "data" => $stmt->fetch(PDO::FETCH_ASSOC)
    ]);
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
?>
