<?php
function googleBase64UrlDecode($value)
{
    $padding = strlen($value) % 4;
    if ($padding !== 0) {
        $value .= str_repeat('=', 4 - $padding);
    }

    $decoded = base64_decode(strtr($value, '-_', '+/'), true);
    if ($decoded === false) {
        throw new RuntimeException('Invalid Google identity token.');
    }
    return $decoded;
}

function googleDerLength($length)
{
    if ($length < 0x80) {
        return chr($length);
    }

    $encoded = '';
    while ($length > 0) {
        $encoded = chr($length & 0xff) . $encoded;
        $length >>= 8;
    }
    return chr(0x80 | strlen($encoded)) . $encoded;
}

function googleDerInteger($value)
{
    $value = ltrim($value, "\x00");
    if ($value === '' || (ord($value[0]) & 0x80)) {
        $value = "\x00" . $value;
    }
    return "\x02" . googleDerLength(strlen($value)) . $value;
}

function googleJwkToPem($modulus, $exponent)
{
    $rsaPublicKey = "\x30"
        . googleDerLength(strlen(googleDerInteger($modulus) . googleDerInteger($exponent)))
        . googleDerInteger($modulus)
        . googleDerInteger($exponent);
    $rsaAlgorithm = hex2bin('300d06092a864886f70d0101010500');
    $subjectPublicKey = "\x03" . googleDerLength(strlen($rsaPublicKey) + 1) . "\x00" . $rsaPublicKey;
    $subjectPublicKeyInfo = "\x30"
        . googleDerLength(strlen($rsaAlgorithm . $subjectPublicKey))
        . $rsaAlgorithm
        . $subjectPublicKey;

    return "-----BEGIN PUBLIC KEY-----\n"
        . chunk_split(base64_encode($subjectPublicKeyInfo), 64, "\n")
        . "-----END PUBLIC KEY-----\n";
}

function googleSigningKeys()
{
    $cachePath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ecom_google_signing_keys.json';
    if (is_file($cachePath) && filemtime($cachePath) > time() - 3600) {
        $cached = json_decode(file_get_contents($cachePath), true);
        if (is_array($cached) && !empty($cached['keys'])) {
            return $cached['keys'];
        }
    }

    $curl = curl_init('https://www.googleapis.com/oauth2/v3/certs');
    $curlOptions = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ];
    $caBundle = getenv('CURL_CA_BUNDLE')
        ?: ($_SERVER['CURL_CA_BUNDLE'] ?? '')
        ?: ini_get('curl.cainfo');
    if (!$caBundle || !is_file($caBundle)) {
        $wampCaBundle = 'C:/wamp64/apps/phpmyadmin5.2.3/vendor/composer/ca-bundle/res/cacert.pem';
        $caBundle = is_file($wampCaBundle) ? $wampCaBundle : $caBundle;
    }
    if ($caBundle && is_file($caBundle)) {
        $curlOptions[CURLOPT_CAINFO] = $caBundle;
    }
    curl_setopt_array($curl, $curlOptions);
    $response = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    if ($response === false || $status !== 200) {
        throw new RuntimeException('Unable to verify Google sign-in right now.' . ($error ? ' ' . $error : ''));
    }

    $keySet = json_decode($response, true);
    if (!is_array($keySet) || empty($keySet['keys'])) {
        throw new RuntimeException('Google returned an invalid signing key set.');
    }

    $temporaryPath = $cachePath . '.' . getmypid() . '.tmp';
    if (file_put_contents($temporaryPath, $response, LOCK_EX) !== false) {
        if (!@rename($temporaryPath, $cachePath)) {
            @unlink($temporaryPath);
        }
    }
    return $keySet['keys'];
}

function verifyGoogleIdToken($token)
{
    if (!is_string($token) || $token === '') {
        throw new RuntimeException('Google identity token is required.');
    }

    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new RuntimeException('Invalid Google identity token.');
    }

    $header = json_decode(googleBase64UrlDecode($parts[0]), true);
    $claims = json_decode(googleBase64UrlDecode($parts[1]), true);
    $signature = googleBase64UrlDecode($parts[2]);
    if (!is_array($header) || !is_array($claims) || ($header['alg'] ?? '') !== 'RS256') {
        throw new RuntimeException('Invalid Google identity token.');
    }

    $clientId = getenv('GOOGLE_CLIENT_ID')
        ?: '35239460776-k8pppm2p4mkc7b0mqoc6kiumo3tp7d5m.apps.googleusercontent.com';
    $audiences = is_array($claims['aud'] ?? null) ? $claims['aud'] : [$claims['aud'] ?? ''];
    $issuer = $claims['iss'] ?? '';
    if (
        !in_array($issuer, ['accounts.google.com', 'https://accounts.google.com'], true)
        || !in_array($clientId, $audiences, true)
        || !isset($claims['exp'], $claims['iat'])
        || (int) $claims['exp'] <= time()
        || (int) $claims['iat'] > time() + 60
        || empty($claims['email'])
        || !filter_var($claims['email'], FILTER_VALIDATE_EMAIL)
        || !in_array($claims['email_verified'] ?? false, [true, 'true', 1, '1'], true)
        || empty($claims['sub'])
    ) {
        throw new RuntimeException('Google account email could not be verified.');
    }

    foreach (googleSigningKeys() as $key) {
        if (($key['kid'] ?? '') !== ($header['kid'] ?? '') || ($key['kty'] ?? '') !== 'RSA') {
            continue;
        }

        $publicKey = openssl_pkey_get_public(googleJwkToPem(
            googleBase64UrlDecode($key['n']),
            googleBase64UrlDecode($key['e'])
        ));
        if ($publicKey !== false && openssl_verify(
            $parts[0] . '.' . $parts[1],
            $signature,
            $publicKey,
            OPENSSL_ALGO_SHA256
        ) === 1) {
            return $claims;
        }
    }

    throw new RuntimeException('Google identity token signature is invalid.');
}
?>
