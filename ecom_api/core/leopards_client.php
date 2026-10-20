<?php
// Leopards Courier (LCS) Pakistan client.
//
// Live mode talks to the real Leopards Courier Merchant API:
//   - POST {BASE}/getAllCities/format/json/
//   - POST {BASE}/bookPacket/format/json/
//   - POST {BASE}/trackBookedPacket/format/json/
//   - POST {BASE}/cancelBookedPackets/format/json/
//
// Demo mode (used automatically until real credentials are supplied via
// environment variables or core/config.php) simulates the whole flow:
// fake CNs (e.g. LCS88413670), time-based checkpoints that advance every
// few hours, and professionally generated Leopards shipping labels (PDF).
// The rest of the app never has to care which mode is active.

require_once __DIR__ . '/pdf_helper.php';

class LeopardsClient
{
    const STAGING_BASE    = 'https://merchantapistaging.leopardscourier.com/api';
    const PRODUCTION_BASE = 'https://merchantapi.leopardscourier.com/api';
    const DEMO_STAGE_HOURS = 2; // demo checkpoints advance every 2 hours

    private $baseUrl;
    private $apiKey;
    private $apiPassword;
    private $configured;
    private $originCityId;
    private $defaultDestCityId;

    public function __construct()
    {
        $env = strtolower((string)self::conf('LCS_ENVIRONMENT', 'LCS_ENVIRONMENT', 'sandbox'));
        $base = self::conf('LCS_BASE', 'LCS_BASE', '');
        if ($base !== '') {
            $this->baseUrl = rtrim($base, '/');
        } else {
            $this->baseUrl = $env === 'production' ? self::PRODUCTION_BASE : self::STAGING_BASE;
        }

        $this->apiKey      = (string)self::conf('LCS_API_KEY', 'LCS_API_KEY', '');
        $this->apiPassword = (string)self::conf('LCS_API_PASSWORD', 'LCS_API_PASSWORD', '');
        $this->configured  = ($this->apiKey !== '' && $this->apiPassword !== '');

        $this->originCityId      = (int)self::conf('LCS_ORIGIN_CITY_ID', 'LCS_ORIGIN_CITY_ID', 789);
        $this->defaultDestCityId = (int)self::conf('LCS_DEFAULT_DEST_CITY_ID', 'LCS_DEFAULT_DEST_CITY_ID', 790);
    }

    public function isConfigured() { return $this->configured; }
    public function mode() { return $this->configured ? 'live' : 'demo'; }
    public function courierName() { return 'Leopards Courier'; }

    private static function conf($envKey, $constKey, $default = '')
    {
        $v = getenv($envKey);
        if ($v !== false && $v !== '') return $v;
        if (defined($constKey)) return constant($constKey);
        return $default;
    }

    private function cacheDir()
    {
        $dir = __DIR__ . '/../uploads/lcs_cache';
        if (!is_dir($dir)) @mkdir($dir, 0777, true);
        return $dir;
    }

    // ── Cities ──────────────────────────────────────────────────────────

    // Returns array of cities: [['id'=>789, 'name'=>'Karachi', ...]]
    public function getCities($forceRefresh = false)
    {
        $cachePath = $this->cacheDir() . '/cities.json';
        if (!$forceRefresh && is_file($cachePath) && (time() - filemtime($cachePath) < 86400)) {
            $cached = json_decode(@file_get_contents($cachePath), true);
            if (is_array($cached) && !empty($cached)) return $cached;
        }

        if (!$this->configured) {
            // Built-in standard cities for offline / demo mode
            $standard = [
                ['id' => 789, 'name' => 'Karachi', 'can_origin' => 1, 'can_destination' => 1],
                ['id' => 790, 'name' => 'Lahore', 'can_origin' => 1, 'can_destination' => 1],
                ['id' => 791, 'name' => 'Islamabad', 'can_origin' => 1, 'can_destination' => 1],
                ['id' => 792, 'name' => 'Rawalpindi', 'can_origin' => 1, 'can_destination' => 1],
                ['id' => 793, 'name' => 'Faisalabad', 'can_origin' => 1, 'can_destination' => 1],
                ['id' => 794, 'name' => 'Multan', 'can_origin' => 1, 'can_destination' => 1],
                ['id' => 795, 'name' => 'Peshawar', 'can_origin' => 1, 'can_destination' => 1],
                ['id' => 796, 'name' => 'Quetta', 'can_origin' => 1, 'can_destination' => 1],
                ['id' => 797, 'name' => 'Sialkot', 'can_origin' => 1, 'can_destination' => 1],
                ['id' => 798, 'name' => 'Hyderabad', 'can_origin' => 1, 'can_destination' => 1],
                ['id' => 799, 'name' => 'Gujranwala', 'can_origin' => 1, 'can_destination' => 1],
            ];
            @file_put_contents($cachePath, json_encode($standard));
            return $standard;
        }

        $res = $this->apiCall('getAllCities');
        $body = json_decode($res['body'], true);
        $cities = [];
        if (is_array($body)) {
            $rawList = $body['city_list'] ?? $body['data'] ?? (isset($body[0]) ? $body : []);
            foreach ($rawList as $c) {
                if (!is_array($c)) continue;
                $cities[] = [
                    'id'              => (int)($c['id'] ?? $c['city_id'] ?? 0),
                    'name'            => (string)($c['name'] ?? $c['city_name'] ?? ''),
                    'can_origin'      => (int)($c['can_origin'] ?? 1),
                    'can_destination' => (int)($c['can_destination'] ?? 1),
                ];
            }
        }
        if (!empty($cities)) {
            @file_put_contents($cachePath, json_encode($cities));
            return $cities;
        }
        return [];
    }

    // Resolve a city name / free text address to Leopards numeric city ID
    public function resolveCityId($cityNameOrAddress)
    {
        $text = strtolower((string)$cityNameOrAddress);
        $cities = $this->getCities();
        foreach ($cities as $c) {
            $cName = strtolower($c['name']);
            if ($cName !== '' && (strpos($text, $cName) !== false || $text === $cName)) {
                return $c['id'];
            }
        }
        return $this->defaultDestCityId;
    }

    // ── Booking ─────────────────────────────────────────────────────────

    // Books a packet with Leopards Courier.
    // $orderInfo keys:
    //   order_id, name, phone, email, address, city,
    //   cod, weight (kg or grams), pieces, description, special_instructions
    // Returns ['ok'=>bool, 'cn'=>string, 'slip_url'=>string, 'error'=>string]
    public function bookShipment(array $orderInfo)
    {
        if (!$this->configured) {
            // Demo: mint an authentic-looking Leopards CN (LCS + 8 digits)
            $cn = 'LCS' . str_pad((string)random_int(10000000, 99999999), 8, '0', STR_PAD_LEFT);
            return [
                'ok'       => true,
                'cn'       => $cn,
                'slip_url' => '',
                'demo'     => true,
                'error'    => '',
            ];
        }

        $orderId = $orderInfo['order_id'] ?? $orderInfo['reference'] ?? 'ORD-' . time();
        $codAmount = (float)($orderInfo['cod'] ?? 0);

        // Weight: Leopards uses grams
        $weightGrams = (int)($orderInfo['weight_grams'] ?? 0);
        if ($weightGrams <= 0) {
            $weightKg = (float)($orderInfo['weight'] ?? 0.5);
            $weightGrams = max(200, (int)round($weightKg * 1000));
        }

        $destCityId = !empty($orderInfo['dest_city_id'])
            ? (int)$orderInfo['dest_city_id']
            : $this->resolveCityId($orderInfo['city'] ?? $orderInfo['address'] ?? '');

        // Shipper defaults
        $shipperName    = (string)self::conf('LCS_SHIPPER_NAME', 'LCS_SHIPPER_NAME', 'My Store');
        $shipperEmail   = (string)self::conf('LCS_SHIPPER_EMAIL', 'LCS_SHIPPER_EMAIL', 'info@mystore.com');
        $shipperPhone   = (string)self::conf('LCS_SHIPPER_PHONE', 'LCS_SHIPPER_PHONE', '03001234567');
        $shipperAddress = (string)self::conf('LCS_SHIPPER_ADDRESS', 'LCS_SHIPPER_ADDRESS', 'Warehouse 1, Karachi');

        $payload = [
            'booked_packet_weight'         => $weightGrams,
            'booked_packet_vol_weight_w'   => '',
            'booked_packet_vol_weight_h'   => '',
            'booked_packet_vol_weight_l'   => '',
            'booked_packet_no_piece'       => (int)($orderInfo['pieces'] ?? 1),
            'booked_packet_collect_amount' => (int)round($codAmount),
            'booked_packet_order_id'       => (string)$orderId,
            'origin_city'                  => $this->originCityId,
            'destination_city'             => $destCityId,
            'shipment_name_eng'            => $shipperName,
            'shipment_email'               => $shipperEmail,
            'shipment_phone'               => $shipperPhone,
            'shipment_address'             => $shipperAddress,
            'consignment_name_eng'         => (string)($orderInfo['name'] ?? 'Customer'),
            'consignment_email'            => (string)($orderInfo['email'] ?? ''),
            'consignment_phone'            => (string)($orderInfo['phone'] ?? ''),
            'consignment_address'          => (string)($orderInfo['address'] ?? ''),
            'special_instructions'         => (string)($orderInfo['special_instructions'] ?? $orderInfo['description'] ?? 'Handle with care'),
        ];

        $resp = $this->apiCall('bookPacket', $payload);
        $body = json_decode($resp['body'], true) ?? [];

        // Check for CN in various possible response fields
        $cn = null;
        $slipUrl = '';
        if (is_array($body)) {
            foreach (['track_number', 'track_no', 'trackNumber', 'cn', 'consignment_no', 'consignmentNumber', 'packet_id'] as $k) {
                if (!empty($body[$k]) && is_string($body[$k])) { $cn = $body[$k]; break; }
            }
            if (!$cn && isset($body['data']) && is_array($body['data'])) {
                foreach (['track_number', 'track_no', 'cn', 'consignment_no'] as $k) {
                    if (!empty($body['data'][$k])) { $cn = $body['data'][$k]; break; }
                }
            }
            $slipUrl = $body['slip_url'] ?? $body['slip'] ?? ($body['data']['slip_url'] ?? '');
        }

        $statusOk = isset($body['status']) && ($body['status'] == 1 || $body['status'] === true || $body['status'] === 'success');
        if ($cn || $statusOk) {
            return [
                'ok'       => true,
                'cn'       => (string)($cn ?: ($body['track_number'] ?? $orderId)),
                'slip_url' => (string)$slipUrl,
                'raw'      => $body,
                'error'    => '',
            ];
        }

        $err = 'Leopards booking failed (HTTP ' . $resp['code'] . ')';
        if (!empty($body['error'])) {
            $err .= ': ' . (is_array($body['error']) ? implode('; ', $body['error']) : $body['error']);
        } elseif (!empty($body['message'])) {
            $err .= ': ' . $body['message'];
        }
        return ['ok' => false, 'cn' => '', 'slip_url' => '', 'error' => $err, 'raw' => $body];
    }

    // ── Tracking ────────────────────────────────────────────────────────

    // Returns ['ok'=>bool, 'checkpoints'=>[['status_code','status_text','location','checkpoint_at']], 'error'=>string]
    public function trackConsignments(array $consignmentNos)
    {
        if (empty($consignmentNos)) {
            return ['ok' => true, 'checkpoints' => [], 'error' => ''];
        }

        if (!$this->configured) {
            return ['ok' => true, 'checkpoints' => [], 'error' => '', 'demo' => true];
        }

        $cnsString = implode(',', $consignmentNos);
        $resp = $this->apiCall('trackBookedPacket', ['track_numbers' => $cnsString]);
        $body = json_decode($resp['body'], true) ?? [];

        if ($resp['code'] >= 400 || !is_array($body)) {
            return ['ok' => false, 'checkpoints' => [], 'error' => 'Leopards tracking failed (HTTP ' . $resp['code'] . ')'];
        }

        $checkpoints = $this->extractCheckpoints($body, $consignmentNos);
        return ['ok' => true, 'checkpoints' => $checkpoints, 'error' => ''];
    }

    private function extractCheckpoints(array $body, array $wantedCns)
    {
        $out = [];
        $lists = [];
        $dig = function ($node) use (&$lists, &$dig) {
            if (!is_array($node)) return;
            foreach ($node as $k => $v) {
                if (is_array($v)) {
                    $lk = strtolower((string)$k);
                    if (strpos($lk, 'track') !== false || strpos($lk, 'checkpoint') !== false || strpos($lk, 'detail') !== false || strpos($lk, 'packet') !== false) {
                        $lists[] = $v;
                    }
                    $dig($v);
                }
            }
        };
        $dig($body);

        foreach ($lists as $list) {
            foreach ($list as $item) {
                if (!is_array($item)) continue;
                $status = $item['status'] ?? $item['Status'] ?? $item['activity'] ?? $item['status_text'] ?? '';
                if ($status === '' || is_array($status)) continue;
                $date = $item['date'] ?? $item['datetime'] ?? $item['activity_date'] ?? $item['checkpoint_at'] ?? '';
                $out[] = [
                    'status_code'    => (string)($item['status_code'] ?? $item['code'] ?? 'LCS'),
                    'status_text'    => trim((string)$status),
                    'location'       => trim((string)($item['location'] ?? $item['city'] ?? '')),
                    'checkpoint_at'  => self::parseDate($date),
                    'consignment_no' => (string)($item['track_number'] ?? $item['cn'] ?? ($wantedCns[0] ?? '')),
                ];
            }
        }

        // Deduplicate
        $seen = [];
        return array_values(array_filter($out, function ($cp) use (&$seen) {
            $k = $cp['status_text'] . '|' . $cp['checkpoint_at'];
            if (isset($seen[$k])) return false;
            $seen[$k] = true;
            return true;
        }));
    }

    private static function parseDate($date)
    {
        if (!$date || !is_scalar($date)) return null;
        $ts = strtotime((string)$date);
        return $ts ? date('Y-m-d H:i:s', $ts) : null;
    }

    // Demo checkpoints: deterministic stages advancing every DEMO_STAGE_HOURS
    public function demoCheckpoints($cn, $bookedAt)
    {
        $start = $bookedAt ? strtotime($bookedAt) : time();
        $hours = max(0, (time() - $start) / 3600);
        $stage = min(4, (int)floor($hours / self::DEMO_STAGE_HOURS));

        $script = [
            ['BOOKED',   'Shipment booked with Leopards Courier'],
            ['PICKED',   'Parcel picked up by Leopards rider'],
            ['TRANSIT',  'Arrived at Leopards sorting hub (In Transit)'],
            ['OFD',      'Out for delivery with Leopards courier rider'],
            ['DELIVERED','Delivered — parcel received and payment collected'],
        ];
        $events = [];
        for ($i = 0; $i <= $stage; $i++) {
            $at = date('Y-m-d H:i:s', $start + $i * self::DEMO_STAGE_HOURS * 3600);
            $events[] = [
                'status_code'   => $script[$i][0],
                'status_text'   => $script[$i][1],
                'location'      => $i === 0 ? 'KARACHI' : ($i >= 3 ? 'DESTINATION CITY' : 'IN TRANSIT'),
                'checkpoint_at' => $at,
            ];
        }
        return array_reverse($events); // newest first
    }

    // ── Status mapping ──────────────────────────────────────────────────

    // Leopards status text -> internal order status + human label.
    public static function mapStatus($statusText, $statusCode = '')
    {
        $s = strtoupper($statusText . ' ' . $statusCode);
        if (strpos($s, 'DELIVER') !== false) {
            return ['order_status' => 'delivered', 'label' => 'Delivered', 'done' => true];
        }
        if (strpos($s, 'RETURN') !== false || strpos($s, 'REVERSE') !== false) {
            return ['order_status' => 'returned', 'label' => 'Returned', 'done' => true];
        }
        if (strpos($s, 'CANCEL') !== false) {
            return ['order_status' => 'cancelled', 'label' => 'Cancelled', 'done' => true];
        }
        if (strpos($s, 'OFD') !== false || strpos($s, 'OUT FOR') !== false) {
            return ['order_status' => 'shipped', 'label' => 'Out for Delivery', 'done' => false];
        }
        if (strpos($s, 'TRANSIT') !== false || strpos($s, 'HUB') !== false || strpos($s, 'DEPART') !== false) {
            return ['order_status' => 'shipped', 'label' => 'In Transit', 'done' => false];
        }
        if (strpos($s, 'PICK') !== false) {
            return ['order_status' => 'shipped', 'label' => 'Picked Up', 'done' => false];
        }
        if (strpos($s, 'BOOK') !== false || strpos($s, 'CREATE') !== false) {
            return ['order_status' => 'shipped', 'label' => 'Booked with Leopards', 'done' => false];
        }
        return ['order_status' => 'shipped', 'label' => ucfirst(strtolower(trim($statusText ?: 'In Transit'))), 'done' => false];
    }

    // ── Cancel ──────────────────────────────────────────────────────────

    public function cancelBooking($cn)
    {
        if (!$this->configured) {
            return ['ok' => true, 'error' => ''];
        }

        $resp = $this->apiCall('cancelBookedPackets', ['cn_numbers' => $cn]);
        $body = json_decode($resp['body'], true) ?? [];
        if ($resp['code'] >= 400 || (isset($body['status']) && $body['status'] == 0)) {
            $err = 'Leopards cancel failed: ' . ($body['error'] ?? $body['message'] ?? 'HTTP ' . $resp['code']);
            return ['ok' => false, 'error' => $err];
        }
        return ['ok' => true, 'error' => ''];
    }

    // ── Shipping Label PDF ───────────────────────────────────────────────

    // Generates a high quality Leopards Courier shipping label
    public function getLabelPdf($cn, array $orderInfo = [])
    {
        $pdf = new MiniPdf();
        $pdf->addPage();

        // Leopards signature colors: Yellow (0.96, 0.68, 0.0) & Dark Slate (0.12, 0.12, 0.14)
        $YELLOW_R = 0.96; $YELLOW_G = 0.68; $YELLOW_B = 0.05;
        $DARK_R   = 0.12; $DARK_G   = 0.12; $DARK_B   = 0.14;

        // Top Header Banner
        $pdf->rect(0, 0, MiniPdf::PAGE_W, 96, $YELLOW_R, $YELLOW_G, $YELLOW_B);
        $pdf->text(40, 38, 22, 'LEOPARDS COURIER', true, $DARK_R, $DARK_G, $DARK_B);
        $isLive = ($orderInfo['mode'] ?? $this->mode()) === 'live';
        $sub = $isLive ? 'Official Leopards Courier Shipping Label' : 'DEMO SHIPPING LABEL (Leopards Simulation)';
        $pdf->text(40, 64, 11, $sub, false, 0.25, 0.25, 0.25);
        $pdf->textRight(MiniPdf::PAGE_W - 40, 38, 16, 'CN: ' . $cn, true, $DARK_R, $DARK_G, $DARK_B);

        // Consignee Block
        $pdf->text(40, 135, 10, 'CONSIGNEE (DELIVER TO):', true, 0.45, 0.45, 0.45);
        $pdf->text(40, 155, 14, $orderInfo['name'] ?? 'Customer', true);
        $pdf->text(40, 175, 10.5, substr($orderInfo['address'] ?? 'Customer Address', 0, 75));
        $pdf->text(40, 193, 10.5, 'Phone: ' . ($orderInfo['phone'] ?? '-'));

        // Service Badge on the right
        $pdf->rect(MiniPdf::PAGE_W - 200, 125, 160, 84, 0.95, 0.95, 0.95);
        $pdf->text(MiniPdf::PAGE_W - 188, 148, 10, 'SERVICE TYPE', true, 0.4, 0.4, 0.4);
        $pdf->text(MiniPdf::PAGE_W - 188, 168, 13, 'OVERNIGHT / DETR', true, $DARK_R, $DARK_G, $DARK_B);
        $pdf->text(MiniPdf::PAGE_W - 188, 190, 10, 'Order #' . ($orderInfo['order_id'] ?? ''), false);

        // Divider
        $pdf->line(40, 230, MiniPdf::PAGE_W - 40, 230, 0.8, 0.85, 0.85, 0.85);

        // Payment / COD block
        $codAmount = (float)($orderInfo['cod'] ?? 0);
        $pdf->text(40, 255, 10, 'PAYMENT DETAILS:', true, 0.45, 0.45, 0.45);
        if ($codAmount > 0) {
            $pdf->rect(40, 270, 240, 36, 0.98, 0.92, 0.85);
            $pdf->text(52, 293, 13, 'CASH ON DELIVERY (COD): Rs. ' . number_format($codAmount, 2), true, 0.7, 0.2, 0.1);
        } else {
            $pdf->rect(40, 270, 180, 36, 0.92, 0.97, 0.93);
            $pdf->text(52, 293, 13, 'PREPAID / PAID ONLINE', true, 0.1, 0.5, 0.2);
        }

        // Shipper Info
        $shipperName    = (string)self::conf('LCS_SHIPPER_NAME', 'LCS_SHIPPER_NAME', 'My Store');
        $shipperAddress = (string)self::conf('LCS_SHIPPER_ADDRESS', 'LCS_SHIPPER_ADDRESS', 'Karachi, Pakistan');
        $pdf->text(40, 345, 10, 'SHIPPER (ORIGIN):', true, 0.45, 0.45, 0.45);
        $pdf->text(40, 362, 11, $shipperName, true);
        $pdf->text(40, 378, 9.5, $shipperAddress, false, 0.35, 0.35, 0.35);

        // Pseudo Barcode representing the CN
        $pdf->line(40, 420, MiniPdf::PAGE_W - 40, 420, 0.8, 0.85, 0.85, 0.85);
        $pdf->text(40, 445, 10, 'LEOPARDS BARCODE & CONSIGNMENT NUMBER', true, 0.45, 0.45, 0.45);

        $x = 40;
        $seed = crc32($cn);
        while ($x < MiniPdf::PAGE_W - 40) {
            $w = 1 + (($seed >> ($x % 16)) & 3);
            $pdf->rect($x, 460, $w, 85, $DARK_R, $DARK_G, $DARK_B);
            $x += $w + 1 + (($seed >> (($x + 7) % 20)) & 2);
        }

        $pdf->text(40, 565, 14, '*' . $cn . '*', true, $DARK_R, $DARK_G, $DARK_B);
        $pdf->textRight(MiniPdf::PAGE_W - 40, 565, 10, 'Scan at sorting & dispatch', false, 0.5, 0.5, 0.5);

        return ['ok' => true, 'pdf' => $pdf->output(), 'error' => ''];
    }

    // ── Low-level HTTP ──────────────────────────────────────────────────

    private function apiCall($endpoint, array $payload = [])
    {
        $url = $this->baseUrl . '/' . trim($endpoint, '/') . '/format/json/';

        $body = array_merge([
            'api_key'      => $this->apiKey,
            'api_password' => $this->apiPassword,
        ], $payload);

        $jsonPayload = json_encode($body);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 25,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $jsonPayload,
            CURLOPT_SSL_VERIFYPEER => false, // Handles Windows WAMP certificate authority bundle
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Content-Length: ' . strlen($jsonPayload),
            ],
        ]);

        $out  = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($out === false) {
            error_log("[Leopards] HTTP error POST $url: $err");
            return ['code' => 0, 'body' => ''];
        }
        return ['code' => $code, 'body' => $out];
    }
}
?>
