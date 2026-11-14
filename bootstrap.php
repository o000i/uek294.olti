<?php
declare(strict_types=1);
// API-Token bleiben in der serverseitigen Sitzung.
ini_set('session.use_strict_mode', '1');
session_set_cookie_params(['httponly' => true, 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'samesite' => 'Lax']);
session_start();
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));

function jsonAntwort(int $status, mixed $daten = null): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    if ($status !== 204) {
        echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }
    exit;
}
function pruefeCsrf(): void
{
    if (!hash_equals($_SESSION['csrf'], $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) {
        jsonAntwort(403, ['message' => 'Bitte lade die Seite neu. Die Sitzung ist nicht mehr aktuell.']);
    }
}
function leseJson(): array
{
    try {
        $daten = json_decode(file_get_contents('php://input'), true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException $fehler) {
        jsonAntwort(400, ['message' => 'Die Formulardaten sind ungültig.']);
    }
    if (!is_array($daten) || array_is_list($daten)) {
        jsonAntwort(400, ['message' => 'Bitte fülle das Formular vollständig aus.']);
    }
    return $daten;
}
