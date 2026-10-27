<?php
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

function sendEmailVerificationCode($email, $fullName, $code)
{
    $getSetting = function ($name, $default = '') {
        $value = getenv($name);
        if ($value === false || $value === '') {
            $value = $_SERVER[$name] ?? '';
        }
        return $value !== '' ? $value : $default;
    };

    $host = $getSetting('SMTP_HOST');
    $port = $getSetting('SMTP_PORT', '587');
    $username = $getSetting('SMTP_USERNAME');
    $password = $getSetting('SMTP_PASSWORD');
    $encryption = strtolower($getSetting('SMTP_ENCRYPTION', 'tls'));
    $fromEmail = $getSetting('SMTP_FROM_EMAIL');
    $fromName = $getSetting('SMTP_FROM_NAME', 'My Store');

    if (!$host || !$username || !$password || !$fromEmail || !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('SMTP configuration is incomplete.');
    }
    if (!in_array($encryption, ['tls', 'ssl'], true)) {
        throw new RuntimeException('SMTP_ENCRYPTION must be tls or ssl.');
    }

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = $host;
        $mail->SMTPAuth = true;
        $mail->Username = $username;
        $mail->Password = $password;
        $mail->SMTPSecure = $encryption;
        $mail->Port = (int) $port;
        $mail->Timeout = 15;
        $mail->CharSet = 'UTF-8';
        $mail->setFrom($fromEmail, $fromName);
        $mail->addAddress($email, $fullName);
        $mail->isHTML(true);
        $mail->Subject = 'Verify your email address';
        $safeName = htmlspecialchars($fullName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $mail->Body = '<p>Hello ' . $safeName . ',</p>'
            . '<p>Use this verification code to finish creating your account:</p>'
            . '<p style="font-size:28px;font-weight:bold;letter-spacing:8px">' . $code . '</p>'
            . '<p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>';
        $mail->AltBody = "Hello $fullName,\n\nYour email verification code is $code. "
            . "It expires in 10 minutes. If you did not request it, you can ignore this email.";
        $mail->send();
    } catch (Exception $exception) {
        error_log('Email verification delivery failed: ' . $mail->ErrorInfo);
        throw new RuntimeException('Unable to send the verification email.', 0, $exception);
    }
}
?>
