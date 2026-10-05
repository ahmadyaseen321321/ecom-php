<?php
class FcmService {
    // IMPORTANT: Replace with your Firebase Server Key from Firebase Console
    private static $serverKey = 'YOUR_FIREBASE_SERVER_KEY_HERE';

    public static function sendPush($tokens, $title, $body, $data = []) {
        if (self::$serverKey == 'YOUR_FIREBASE_SERVER_KEY_HERE') {
            return false;
        }

        $url = 'https://fcm.googleapis.com/fcm/send';

        $notification = [
            'title' => $title,
            'body' => $body,
            'sound' => 'default',
            'badge' => '1'
        ];

        $fields = [
            'registration_ids' => (array) $tokens,
            'notification' => $notification,
            'data' => $data,
            'priority' => 'high'
        ];

        $headers = [
            'Authorization: key=' . self::$serverKey,
            'Content-Type: application/json'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));

        $result = curl_exec($ch);
        curl_close($ch);

        return $result;
    }
}
?>
