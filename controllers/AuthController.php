
<?php
session_start();

$daten = json_decode(file_get_contents("php://input"), true);

if (empty($daten["username"]) || empty($daten["password"])) {
    http_response_code(400);
    exit;
}

$cookies = [];

$curl = curl_init("https://campus.csbe.ch/uek294/api/v1/authenticate");

curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
    CURLOPT_POSTFIELDS => json_encode($daten),
    CURLOPT_TIMEOUT => 15
]);

curl_setopt($curl, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$cookies) {
    if (stripos($header, "Set-Cookie:") === 0) {
        $cookies[] = explode(";", trim(substr($header, 11)))[0];
    }
    return strlen($header);
});

$antwort = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($antwort === false) {
    http_response_code(502);
    exit;
}

if ($status === 204) {
    if (empty($cookies)) {
        http_response_code(502);
        exit;
    }

    session_regenerate_id(true);
    $_SESSION["api_cookies"] = implode("; ", $cookies);
}

http_response_code($status ?: 502);
