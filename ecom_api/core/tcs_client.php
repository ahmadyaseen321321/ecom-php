<?php
// TCS Pakistan courier client.
//
// Live mode talks to the real TCS E-Connect APIs (per the "TCS API User Guide
// v7.0"): two cached tokens (bearer token from /auth/api/auth with
// clientid/clientsecret, accesstoken from /ecom/api/authentication/token with
// username/password), booking, label, tracking and cancel endpoints.
//
// Demo mode (used automatically until real credentials are supplied via
// environment variables TCS_CLIENT_ID / TCS_CLIENT_SECRET / TCS_USERNAME /
// TCS_PASSWORD) simulates the whole flow: fake CNs, time-based checkpoints
// that advance every few hours, and generated label PDFs. The rest of the
// app never has to care which mode is active.
require_once __DIR__ . '/pdf_helper.php';

class TcsClient
{
    const SANDBOX_BASE  = 'https://devconnect.tcscourier.com';
    const PROD_BASE     = 'https://ociconnect.tcscourier.com';
    const DEMO_STAGE_HOURS = 2; // demo checkpoints advance every 2 hours

    private $baseUrl;
    private $configured;

    public function __construct()
    {
        $env = self::conf('TCS_ENVIRONMENT', 'TCS_ENVIRONMENT', 'sandbox');
        $this->baseUrl = rtrim($env === 'production' ? self::PROD_BASE : self::SANDBOX_BASE, '/');
        $this->configured = self::conf('TCS_CLIENT_ID', 'TCS_CLIENT_ID') !== ''
            && self::conf('TCS_CLIENT_SECRET', 'TCS_CLIENT_SECRET') !== ''
            && self::conf('TCS_USERNAME', 'TCS_USERNAME') !== ''
            && self::conf('TCS_PASSWORD', 'TCS_PASSWORD') !== '';
    }

    public function isConfigured() { return $this->configured; }
    public function mode() { return $this->configured ? 'live' : 'demo'; }

    private static function conf($envKey, $constKey, $default = '')
    {
        $v = getenv($envKey);
        if ($v !== false && $v !== '') return $v;
        if (defined($constKey)) return constant($constKey);
        return $default;
    }

    private function cacheFile()
    {
        $dir = __DIR__ . '/../uploads/tcs_cache';
        if (!is_dir($dir)) @mkdir($dir, 0777, true);
        return $dir . '/tokens.json';
    }

    private function cacheRead()
    {
        $f = $this->cacheFile();
        if (!is_file($f)) return [];
        $data = json_decode(@file_get_contents($f), true);
        return is_array($data) ? $data : [];
    }

    private function cacheWrite($data)
    {
        @file_put_contents($this->cacheFile(), json_encode($data), LOCK_EX);
    }

    // ── Tokens ──────────────────────────────────────────────────────────

    // Bearer token: POST/GET {base}/auth/api/auth with clientid+clientsecret.
    // The manual shows GET-with-JSON-body which plain HTTP clients can't do,
    // so we try POST first and fall back to GET.
    public function getBearerToken($force = false)
    {
        $cache = $this->cacheRead();
        if (!$force && !empty($cache['bearer']['token']) && $cache['bearer']['expires_at'] > time()) {
            return $cache['bearer']['token'];
        }

        $payload = json_encode([
            'clientid'     => self::conf('TCS_CLIENT_ID', 'TCS_CLIENT_ID'),
            'clientsecret' => self::conf('TCS_CLIENT_SECRET', 'TCS_CLIENT_SECRET'),
        ]);

        $resp = $this->http($this->baseUrl . '/auth/api/auth', 'POST', $payload, [], true);
        if ($resp['code'] >= 400) {
            $resp = $this->http($this->baseUrl . '/auth/api/auth', 'GET', '', ['Content-Type: application/json'], true, $payload);
        }
        $body = json_decode($resp['body'], true) ?? [];
        $token = $body['token'] ?? $body['bearerToken'] ?? $body['access_token'] ?? null;
        if (!$token) {
            error_log('[TCS] bearer auth failed: ' . substr($resp['body'], 0, 400));
            return null;
        }
        $ttl = (int)($body['expires_in'] ?? $body['expiresIn'] ?? 3540);
        $cache = $this->cacheRead();
        $cache['bearer'] = ['token' => $token, 'expires_at' => time() + max(60, $ttl - 60)];
        $this->cacheWrite($cache);
        return $token;
    }

    // Access token: GET {base}/ecom/api/authentication/token?username=&password=
    public function getAccessToken($force = false)
    {
        $cache = $this->cacheRead();
        if (!$force && !empty($cache['access']['token']) && $cache['access']['expires_at'] > time()) {
            return $cache['access']['token'];
        }

        $qs = http_build_query([
            'username' => self::conf('TCS_USERNAME', 'TCS_USERNAME'),
            'password' => self::conf('TCS_PASSWORD', 'TCS_PASSWORD'),
        ]);
        $resp = $this->http($this->baseUrl . '/ecom/api/authentication/token?' . $qs, 'GET');
        $body = json_decode($resp['body'], true) ?? [];
        $token = $body['accesstoken'] ?? $body['accessToken'] ?? $body['token'] ?? null;
        if (!$token) {
            error_log('[TCS] access token failed: ' . substr($resp['body'], 0, 400));
            return null;
        }
        $ttl = (int)($body['expires_in'] ?? $body['expiresIn'] ?? 3540);
        $cache = $this->cacheRead();
        $cache['access'] = ['token' => $token, 'expires_at' => time() + max(60, $ttl - 60)];
        $this->cacheWrite($cache);
        return $token;
    }

    // Authenticated call with one automatic token refresh on 401.
    private function apiCall($path, $method, $jsonBody = null, $isAuthEndpoint = false)
    {
        $bearer = $this->getBearerToken();
        $access = $isAuthEndpoint ? null : $this->getAccessToken();
        $headers = ['Content-Type: application/json'];
        if ($bearer) $headers[] = 'Authorization: Bearer ' . $bearer;
        if ($access) $headers[] = 'accesstoken: ' . $access;

        $resp = $this->http($this->baseUrl . $path, $method, $jsonBody !== null ? json_encode($jsonBody) : '', $headers);
        if ($resp['code'] === 401) {
            $bearer = $this->getBearerToken(true);
            $access = $isAuthEndpoint ? null : $this->getAccessToken(true);
            $headers = ['Content-Type: application/json'];
            if ($bearer) $headers[] = 'Authorization: Bearer ' . $bearer;
            if ($access) $headers[] = 'accesstoken: ' . $access;
            $resp = $this->http($this->baseUrl . $path, $method, $jsonBody !== null ? json_encode($jsonBody) : '', $headers);
        }
        return $resp;
    }

    private function http($url, $method = 'GET', $body = null, $headers = [], $returnRaw = false, $rawBodyOverride = null)
    {
        $ch = curl_init($url);
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 25,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_CUSTOMREQUEST   => $method,
        ];
        if ($headers) $opts[CURLOPT_HTTPHEADER] = $headers;
        if ($rawBodyOverride !== null) {
            $opts[CURLOPT_POSTFIELDS] = $rawBodyOverride;
        } else if ($body !== null && $body !== '' && $method !== 'GET') {
            $opts[CURLOPT_POSTFIELDS] = $body;
        }
        curl_setopt_array($ch, $opts);
        $out = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        if ($out === false) {
            error_log("[TCS] HTTP error $method $url: $err");
            return ['code' => 0, 'body' => '', 'raw' => ''];
        }
        return ['code' => $code, 'body' => $out, 'raw' => $out];
    }

    private function logTraceId($resp)
    {
        $body = json_decode($resp['body'], true);
        if (is_array($body) && !empty($body['traceid'])) {
            error_log('[TCS] traceid: ' . $body['traceid']);
        }
    }

    // ── Booking ─────────────────────────────────────────────────────────

    // $d: consignee name, phone (11 digits), address, city, cod amount,
    // weight, content description, order reference.
    // Returns ['ok'=>bool, 'cn'=>string, 'error'=>string, 'raw'=>array]
    public function bookShipment(array $d)
    {
        if (!$this->configured) {
            $cn = 'DEMO' . str_pad((string)random_int(10000000, 99999999), 8, '0', STR_PAD_LEFT);
            return ['ok' => true, 'cn' => $cn, 'error' => '', 'raw' => ['demo' => true]];
        }

        $payload = [
            'pickupDate'     => date('Y-m-d'),
            'orderType'      => '03', // COD per TCS plugin convention
            'consignee'      => $d['name'],
            'middlename'     => '-',           // required by TCS validation
            'address1'       => $d['address'],
            'city'           => $d['city'],
            'phone'          => $d['phone'],
            'codamount'      => number_format((float)$d['cod'], 2, '.', ''),
            'unitprice'      => number_format((float)$d['unit_price'], 2, '.', ''),
            'weight'         => number_format(max(0.5, (float)$d['weight']), 2, '.', ''),
            'contentdesc'    => substr($d['description'], 0, 999),
            'servicecode'    => self::conf('TCS_SERVICE_CODE', 'TCS_SERVICE_CODE', 'OVERNIGHT'),
            'costcentercode' => self::conf('TCS_COST_CENTER_CODE', 'TCS_COST_CENTER_CODE'),
            'reference'      => $d['reference'],
        ];

        $resp = $this->apiCall('/ecom/api/booking/create', 'POST', $payload);
        $this->logTraceId($resp);
        $body = json_decode($resp['body'], true) ?? [];

        $cn = null;
        if (is_array($body)) {
            foreach (['consignmentNo', 'consignmentno', 'cn', 'consignmentNumber'] as $k) {
                if (!empty($body[$k]) && is_string($body[$k])) { $cn = $body[$k]; break; }
            }
            if (!$cn && isset($body['data']) && is_array($body['data'])) {
                foreach (['consignmentNo', 'cn'] as $k) {
                    if (!empty($body['data'][$k])) { $cn = $body['data'][$k]; break; }
                }
            }
        }
        if ($cn) return ['ok' => true, 'cn' => $cn, 'error' => '', 'raw' => $body];

        $err = 'TCS booking failed (HTTP ' . $resp['code'] . ')';
        if (!empty($body['error']) && is_array($body['error'])) {
            $err .= ': ' . implode('; ', array_slice($body['error'], 0, 3));
        }
        return ['ok' => false, 'cn' => '', 'error' => $err, 'raw' => $body];
    }

    // ── Tracking ────────────────────────────────────────────────────────

    // Returns ['ok'=>bool, 'checkpoints'=>[[
    //   'status_code','status_text','location','checkpoint_at'
    // ]], 'error'=>string]
    public function trackConsignments(array $consignmentNos)
    {
        if (empty($consignmentNos)) {
            return ['ok' => true, 'checkpoints' => [], 'error' => ''];
        }

        if (!$this->configured) {
            return ['ok' => true, 'checkpoints' => [], 'error' => '', 'demo' => true];
        }

        // The guide shows GET with a JSON body; try POST first, fall back to GET.
        $payload = ['consignee' => array_values($consignmentNos)];
        $resp = $this->apiCall('/tracking/api/Tracking/GetDynamicTrackDetail', 'POST', $payload);
        if ($resp['code'] >= 400 || $resp['code'] === 0) {
            $resp = $this->apiCall('/tracking/api/Tracking/GetDynamicTrackDetail?' . http_build_query($payload), 'GET');
        }
        $this->logTraceId($resp);
        $body = json_decode($resp['body'], true) ?? [];

        $checkpoints = $this->normalizeCheckpoints($body, $consignmentNos);
        if ($resp['code'] >= 400 && empty($checkpoints)) {
            return ['ok' => false, 'checkpoints' => [], 'error' => 'TCS tracking failed (HTTP ' . $resp['code'] . ')'];
        }
        return ['ok' => true, 'checkpoints' => $checkpoints, 'error' => ''];
    }

    // TCS response shapes vary between versions — dig out anything that
    // looks like a checkpoint list and normalise the keys.
    private function normalizeCheckpoints($body, array $wantedCns)
    {
        $out = [];
        if (!is_array($body)) return $out;

        $lists = [];
        $dig = function ($node) use (&$lists, &$dig) {
            if (!is_array($node)) return;
            foreach ($node as $k => $v) {
                if (is_array($v)) {
                    $lk = strtolower((string)$k);
                    if (strpos($lk, 'checkpoint') !== false || strpos($lk, 'status') !== false || $lk === 'trackingdetails') {
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
                $status = $item['status'] ?? $item['Status'] ?? $item['activity'] ?? $item['Activity'] ?? $item['statusdescription'] ?? '';
                if ($status === '' || is_array($status)) continue;
                $date = $item['datetime'] ?? $item['DateTime'] ?? $item['activitydate'] ?? $item['date'] ?? $item['checkpointtime'] ?? '';
                $out[] = [
                    'status_code'    => (string)($item['statuscode'] ?? $item['StatusCode'] ?? $item['activitycode'] ?? ''),
                    'status_text'    => trim((string)$status),
                    'location'       => trim((string)($item['location'] ?? $item['Location'] ?? $item['city'] ?? $item['currentstatuscity'] ?? '')),
                    'checkpoint_at'  => self::parseTcsDate($date),
                    'consignment_no' => (string)($item['consignmentno'] ?? $item['consignmentNo'] ?? ($wantedCns[0] ?? '')),
                ];
            }
        }

        // de-dupe by status+time
        $seen = [];
        return array_values(array_filter($out, function ($cp) use (&$seen) {
            $k = $cp['status_text'] . '|' . $cp['checkpoint_at'];
            if (isset($seen[$k])) return false;
            $seen[$k] = true;
            return true;
        }));
    }

    private static function parseTcsDate($date)
    {
        if (!$date || !is_scalar($date)) return null;
        $ts = strtotime((string)$date);
        return $ts ? date('Y-m-d H:i:s', $ts) : null;
    }

    // Demo checkpoints: deterministic stages advancing every DEMO_STAGE_HOURS
    // since the booking time — so the courier "moves" while you watch.
    public function demoCheckpoints($cn, $bookedAt)
    {
        $start = $bookedAt ? strtotime($bookedAt) : time();
        $hours = max(0, (time() - $start) / 3600);
        $stage = min(4, (int)floor($hours / self::DEMO_STAGE_HOURS));

        $script = [
            ['BOOKED',   'Shipment booked at TCS facility'],
            ['PICKED',   'Picked up from sender'],
            ['TRANSIT',  'In transit to destination city'],
            ['OFD',      'Out for delivery'],
            ['DELIVERED','Delivered to consignee'],
        ];
        $events = [];
        for ($i = 0; $i <= $stage; $i++) {
            $at = date('Y-m-d H:i:s', $start + $i * self::DEMO_STAGE_HOURS * 3600);
            $events[] = [
                'status_code'   => $script[$i][0],
                'status_text'   => $script[$i][1],
                'location'      => $i === 0 ? 'KARACHI' : ($i >= 3 ? 'DELIVERY CITY' : 'IN TRANSIT'),
                'checkpoint_at' => $at,
            ];
        }
        return array_reverse($events); // newest first
    }

    // ── Status mapping ──────────────────────────────────────────────────

    // TCS status -> internal order status + human label.
    public static function mapStatus($statusText, $statusCode = '')
    {
        $s = strtoupper($statusText . ' ' . $statusCode);
        if (strpos($s, 'DELIVER') !== false) return ['order_status' => 'delivered', 'label' => 'Delivered', 'done' => true];
        if (strpos($s, 'RETURN') !== false || strpos($s, 'REVERSE') !== false) return ['order_status' => 'returned', 'label' => 'Returned', 'done' => true];
        if (strpos($s, 'CANCEL') !== false) return ['order_status' => 'cancelled', 'label' => 'Cancelled', 'done' => true];
        if (strpos($s, 'OFD') !== false || strpos($s, 'OUT FOR') !== false) return ['order_status' => 'shipped', 'label' => 'Out for Delivery', 'done' => false];
        if (strpos($s, 'TRANSIT') !== false || strpos($s, 'IN TRANS') !== false) return ['order_status' => 'shipped', 'label' => 'In Transit', 'done' => false];
        if (strpos($s, 'PICK') !== false) return ['order_status' => 'shipped', 'label' => 'Picked Up', 'done' => false];
        if (strpos($s, 'BOOK') !== false || strpos($s, 'CREATE') !== false) return ['order_status' => 'shipped', 'label' => 'Booked with TCS', 'done' => false];
        return ['order_status' => 'shipped', 'label' => ucfirst(strtolower(trim($statusText ?: 'In Transit'))), 'done' => false];
    }

    // ── Label ───────────────────────────────────────────────────────────

    // Returns ['ok'=>bool,'pdf'=>string,'error'=>string]
    public function getLabelPdf($cn, array $orderInfo = [])
    {
        if ($this->configured) {
            $resp = $this->apiCall('/ecom/api/print/label?cn=' . urlencode($cn), 'GET');
            if ($resp['code'] === 200 && strpos($resp['raw'], '%PDF') === 0) {
                return ['ok' => true, 'pdf' => $resp['raw'], 'error' => ''];
            }
            $this->logTraceId($resp);
            return ['ok' => false, 'pdf' => '', 'error' => 'TCS label fetch failed (HTTP ' . $resp['code'] . ')'];
        }

        // Demo: generate a real PDF label ourselves
        $pdf = new MiniPdf();
        $pdf->addPage();
        // header band
        $pdf->rect(0, 0, MiniPdf::PAGE_W, 96, 0.157, 0.227, 0.180);
        $pdf->text(40, 40, 22, 'TCS Courier — Shipping Label', true, 1, 1, 1);
        $pdf->text(40, 66, 11, ($orderInfo['mode'] ?? 'DEMO') === 'demo' ? 'DEMO LABEL (no live TCS credentials configured)' : 'Official TCS Label', false, 0.82, 0.88, 0.84);
        $pdf->textRight(MiniPdf::PAGE_W - 40, 40, 16, 'CN: ' . $cn, true, 1, 1, 1);

        $pdf->text(40, 140, 10, 'CONSIGNEE', true, 0.45, 0.45, 0.45);
        $pdf->text(40, 158, 13, $orderInfo['name'] ?? 'Customer', true);
        $pdf->text(40, 176, 10, $orderInfo['address'] ?? '');
        $pdf->text(40, 192, 10, 'Phone: ' . ($orderInfo['phone'] ?? '-'));

        $pdf->rect(MiniPdf::PAGE_W - 200, 130, 160, 80, 0.96, 0.96, 0.96);
        $pdf->text(MiniPdf::PAGE_W - 188, 152, 10, 'SERVICE', true, 0.4, 0.4, 0.4);
        $pdf->text(MiniPdf::PAGE_W - 188, 170, 12, 'OVERNIGHT', true);
        $pdf->text(MiniPdf::PAGE_W - 188, 192, 10, 'Order #' . ($orderInfo['order_id'] ?? ''));

        $pdf->text(40, 250, 10, 'ORDER', true, 0.45, 0.45, 0.45);
        $pdf->text(40, 268, 12, '#' . ($orderInfo['order_id'] ?? '') . '  —  COD Rs. ' . number_format((float)($orderInfo['cod'] ?? 0), 2), true);
        $pdf->line(40, 290, MiniPdf::PAGE_W - 40, 290);

        // pseudo barcode: vertical bars derived from the CN
        $x = 40;
        $seed = crc32($cn);
        while ($x < MiniPdf::PAGE_W - 40) {
            $w = 1 + (($seed >> ($x % 16)) & 3);
            $pdf->rect($x, 640, $w, 90, 0.05, 0.05, 0.05);
            $x += $w + 1 + (($seed >> (($x + 7) % 20)) & 2);
        }
        $pdf->text(40, 752, 12, $cn, true);
        return ['ok' => true, 'pdf' => $pdf->output(), 'error' => ''];
    }

    // ── Cancel ──────────────────────────────────────────────────────────

    public function cancelBooking($cn)
    {
        if (!$this->configured) {
            return ['ok' => true, 'error' => ''];
        }
        $resp = $this->apiCall('/ecom/api/booking/cancel', 'POST', ['consignmentNo' => $cn]);
        $this->logTraceId($resp);
        $body = json_decode($resp['body'], true) ?? [];
        if ($resp['code'] >= 400) {
            $err = 'TCS cancel failed (HTTP ' . $resp['code'] . ')';
            if (!empty($body['error']) && is_array($body['error'])) $err .= ': ' . implode('; ', array_slice($body['error'], 0, 3));
            return ['ok' => false, 'error' => $err];
        }
        return ['ok' => true, 'error' => ''];
    }
}
?>
