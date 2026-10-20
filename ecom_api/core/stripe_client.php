<?php
// Stripe payment gateway client.
//
// Live mode talks to the real Stripe REST API using your secret key: it
// creates Checkout Sessions (hosted payment page — PCI-compliant, card data
// never touches this server), retrieves sessions to confirm payment, and
// verifies webhook signatures. No SDK required, plain cURL.
//
// Demo mode (used automatically until a real STRIPE_SECRET_KEY is supplied
// via environment variables or core/config.php) simulates the whole flow:
// fake session ids, a local card-entry step with well-known Stripe test
// card numbers, and instant "payment". The rest of the app never has to
// care which mode is active — it just checks mode() === 'demo'.
class StripeClient
{
    const API_BASE = 'https://api.stripe.com/v1';

    private $secretKey;
    private $publishableKey;
    private $webhookSecret;
    private $currency;

    public function __construct()
    {
        $this->secretKey     = self::conf('STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY');
        $this->publishableKey = self::conf('STRIPE_PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY');
        $this->webhookSecret = self::conf('STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET');
        // PKR minor unit is paisa (100 = Rs. 1). Stripe uses the ISO code.
        $this->currency      = strtolower(self::conf('STRIPE_CURRENCY', 'STRIPE_CURRENCY', 'pkr'));
    }

    public function isConfigured() { return $this->secretKey !== ''; }
    public function mode() { return $this->isConfigured() ? 'live' : 'demo'; }
    public function currency() { return $this->currency; }
    public function publishableKey() { return $this->publishableKey; }

    private static function conf($envKey, $constKey, $default = '')
    {
        $v = getenv($envKey);
        if ($v !== false && $v !== '') return $v;
        if (defined($constKey)) return constant($constKey);
        return $default;
    }

    // ── Money ──────────────────────────────────────────────────────────

    // Stripe amounts are integers in the currency's minor unit (paisa for PKR).
    public function toMinor($amount) { return (int)round(((float)$amount) * 100); }

    // ── Checkout Session ───────────────────────────────────────────────

    // Create a hosted Checkout Session for an order.
    // $order: full order row (id, total_amount, ...). $returnBase: the SPA origin.
    // Returns ['ok'=>bool,'session_id'=>string,'url'=>string,'error'=>string]
    public function createCheckoutSession(array $order, $returnBase, $customerEmail = '')
    {
        $orderId  = $order['id'];
        $amount   = $this->toMinor($order['total_amount']);
        $label    = 'Order #' . $orderId;

        if (!$this->isConfigured()) {
            // Demo: mint a fake session id; the "card entry" happens in-app.
            $sid = 'cs_demo_' . bin2hex(random_bytes(12));
            return ['ok' => true, 'session_id' => $sid, 'url' => '', 'error' => ''];
        }

        $success = rtrim($returnBase, '/') . '/?checkout=success&order_id=' . urlencode($orderId)
                 . '&session_id={CHECKOUT_SESSION_ID}';
        $cancel  = rtrim($returnBase, '/') . '/?checkout=cancelled&order_id=' . urlencode($orderId);

        $post = [
            'mode'                      => 'payment',
            'client_reference_id'       => (string)$orderId,
            'success_url'               => $success,
            'cancel_url'                => $cancel,
            'line_items[0][quantity]'   => '1',
            'line_items[0][price_data][currency]'             => $this->currency,
            'line_items[0][price_data][unit_amount]'          => (string)$amount,
            'line_items[0][price_data][product_data][name]'   => $label,
        ];
        if ($customerEmail !== '') {
            $post['customer_email'] = $customerEmail;
        }
        // Record which order the session belongs to so the webhook can find it.
        $post['metadata[order_id]'] = (string)$orderId;

        $resp = $this->http(self::API_BASE . '/checkout/sessions', 'POST', $post);
        $body = json_decode($resp['body'], true) ?? [];

        if ($resp['code'] >= 400 || empty($body['id'])) {
            $err = 'Stripe session creation failed (HTTP ' . $resp['code'] . ')';
            if (!empty($body['error']['message'])) $err .= ': ' . $body['error']['message'];
            error_log('[Stripe] ' . $err);
            return ['ok' => false, 'session_id' => '', 'url' => '', 'error' => $err];
        }

        return [
            'ok'         => true,
            'session_id' => $body['id'],
            'url'        => $body['url'] ?? '',
            'error'      => '',
        ];
    }

    // Retrieve a session to confirm its payment status.
    // Returns ['ok'=>bool,'paid'=>bool,'payment_intent'=>string,'amount_received'=>int,'error'=>string]
    public function retrieveSession($sessionId)
    {
        if (!$this->isConfigured()) {
            return ['ok' => true, 'paid' => false, 'payment_intent' => '', 'amount_received' => 0, 'error' => ''];
        }

        $resp = $this->http(self::API_BASE . '/checkout/sessions/' . rawurlencode($sessionId)
                . '?expand[]=payment_intent', 'GET');
        $body = json_decode($resp['body'], true) ?? [];

        if ($resp['code'] >= 400 || !is_array($body)) {
            $err = 'Stripe session retrieval failed (HTTP ' . $resp['code'] . ')';
            if (!empty($body['error']['message'])) $err .= ': ' . $body['error']['message'];
            return ['ok' => false, 'paid' => false, 'payment_intent' => '', 'amount_received' => 0, 'error' => $err];
        }

        $pi = $body['payment_intent'];
        if (is_array($pi)) $pi = $pi['id'] ?? '';

        return [
            'ok'              => true,
            'paid'            => ($body['payment_status'] ?? '') === 'paid',
            'payment_intent'  => (string)$pi,
            'amount_received' => (int)($body['amount_total'] ?? 0),
            'error'           => '',
        ];
    }

    // ── Webhook signature verification ─────────────────────────────────
    // Stripe signs webhooks with HMAC-SHA256 over "<timestamp>.<payload>".
    public function verifyWebhookSignature($payload, $sigHeader)
    {
        if ($this->webhookSecret === '' || $sigHeader === '') return false;

        $elements = [];
        foreach (explode(',', $sigHeader) as $pair) {
            $kv = explode('=', trim($pair), 2);
            if (count($kv) === 2) $elements[$kv[0]][] = $kv[1];
        }
        if (empty($elements['t']) || empty($elements['v1'])) return false;

        $timestamp  = $elements['t'][0];
        $signatures = $elements['v1'];
        // Reject events older than 5 minutes to prevent replay.
        if (abs(time() - (int)$timestamp) > 300) return false;

        $signedPayload = $timestamp . '.' . $payload;
        $expected      = hash_hmac('sha256', $signedPayload, $this->webhookSecret);

        foreach ($signatures as $sig) {
            if (hash_equals($expected, $sig)) return true;
        }
        return false;
    }

    // ── Low-level HTTP ─────────────────────────────────────────────────
    private function http($url, $method = 'GET', $post = null)
    {
        $ch = curl_init($url);
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 25,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $this->secretKey,
                'Content-Type: application/x-www-form-urlencoded',
            ],
        ];
        if ($post !== null && $method !== 'GET') {
            $opts[CURLOPT_POSTFIELDS] = http_build_query($post);
        }
        curl_setopt_array($ch, $opts);
        $out = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);
        if ($out === false) {
            error_log("[Stripe] HTTP error $method $url: $err");
            return ['code' => 0, 'body' => ''];
        }
        return ['code' => $code, 'body' => $out];
    }
}
?>
