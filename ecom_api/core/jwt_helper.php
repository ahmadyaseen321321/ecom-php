<?php
require_once 'config.php';

class JWTHelper {
    private static $secret = JWT_SECRET;
    private static $algo = JWT_ALGO;

    public static function generate($data) {
        $header = json_encode(['typ' => 'JWT', 'alg' => self::$algo]);
        $payload = json_encode(array_merge($data, ['exp' => time() + JWT_EXPIRY]));

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function validate($token) {
        $parts = explode('.', $token);
        if (count($parts) != 3) {
            error_log("JWT_ERROR: Invalid token format (expected 3 parts, got " . count($parts) . ")");
            return false;
        }

        list($header, $payload, $signature) = $parts;
        $validSignature = hash_hmac('sha256', $header . "." . $payload, self::$secret, true);
        $validSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($validSignature));

        if ($signature !== $validSignature) {
            error_log("JWT_ERROR: Signature mismatch");
            return false;
        }

        $data = json_decode(base64_decode($payload), true);
        if ($data['exp'] < time()) {
            error_log("JWT_ERROR: Token expired at " . date('Y-m-d H:i:s', $data['exp']) . " current time " . date('Y-m-d H:i:s'));
            return false;
        }

        return $data;
    }

    public static function validateTokenAndGetUserId() {
        $token = self::getBearerToken();
        if (!$token) {
            error_log("JWT_ERROR: No bearer token found in request headers");
            return null;
        }
        $data = self::validate($token);
        return $data ? $data['id'] : null;
    }

    public static function getRole() {
        $token = self::getBearerToken();
        if (!$token) return null;
        $data = self::validate($token);
        return $data ? $data['role'] : null;
    }

    public static function getBearerToken() {
        $headers = array_change_key_case(getallheaders(), CASE_LOWER);
        
        // Log headers for debugging (be careful with sensitive info in production)
        error_log("JWT_DEBUG: Received headers keys: " . implode(', ', array_keys($headers)));

        $authHeader = null;
        if (isset($headers['authorization'])) {
            $authHeader = $headers['authorization'];
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if ($authHeader) {
            error_log("JWT_DEBUG: Auth header found: " . substr($authHeader, 0, 20) . "...");
            if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                return $matches[1];
            } else {
                error_log("JWT_DEBUG: Auth header does not match Bearer pattern");
            }
        }
        
        return null;
    }
}
?>
