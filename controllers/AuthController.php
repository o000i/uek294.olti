<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/ApiClient.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    jsonAntwort(405, ['message' => 'Bitte verwende das Anmeldeformular.']);
}
pruefeCsrf();
$daten = leseJson();
if (!is_string($daten['username'] ?? null) || !is_string($daten['password'] ?? null)
    || trim($daten['username']) === '' || $daten['password'] === '') {
    jsonAntwort(400, ['message' => 'Benutzername und Passwort sind erforderlich.']);
}
$antwort = (new ApiClient())->anfragen('POST', '/authenticate', [
    'username' => trim($daten['username']), 'password' => $daten['password'],
]);
if ($antwort['status'] === 204 && $antwort['cookies'] !== []) {
    session_regenerate_id(true);
    $_SESSION['api_cookies'] = implode('; ', $antwort['cookies']);
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    jsonAntwort(204);
}
if ($antwort['status'] === 401) {
    jsonAntwort(401, ['message' => 'Benutzername oder Passwort ist falsch.']);
}
jsonAntwort(502, ['message' => 'Die Anmeldung bei der Schul-API ist momentan nicht möglich. Bitte versuche es erneut.']);
