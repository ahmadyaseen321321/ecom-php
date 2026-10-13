<?php

class SocketHelper {
    private static $socketServerUrl = 'http://127.0.0.1:4000/api/socket/emit';

    /**
     * Send event to Socket.IO server via HTTP webhook (ultra-fast non-blocking)
     *
     * @param string $event
     * @param array $data
     * @param string|null $room
     * @return bool
     */
    public static function emit($event, $data = [], $room = null) {
        $payload = json_encode([
            'event' => $event,
            'data' => $data,
            'room' => $room
        ]);

        $ch = curl_init(self::$socketServerUrl);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT_MS, 150);
        curl_setopt($ch, CURLOPT_TIMEOUT_MS, 250);
        curl_setopt($ch, CURLOPT_NOSIGNAL, 1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Content-Length: ' . strlen($payload)
        ]);

        $result = curl_exec($ch);
        curl_close($ch);

        return $result !== false;
    }
}
