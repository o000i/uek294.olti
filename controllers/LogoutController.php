<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/ApiClient.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    jsonAntwort(405, ['message' => 'Bitte verwende die Schaltfläche Abmelden.']);
}
pruefeCsrf();
if (!empty($_SESSION['api_cookies'])) {
    (new ApiClient())->anfragen('POST', '/unauthenticate');
}
// Die lokale Sitzung endet auch bei einem API-Ausfall.
$_SESSION = [];
session_regenerate_id(true);
session_destroy();
jsonAntwort(204);
