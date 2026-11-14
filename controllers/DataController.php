<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../models/ApiClient.php';
// Zugriffsschutz gilt auch bei direkten Anfragen ohne Benutzeroberfläche.
if (empty($_SESSION['api_cookies'])) {
    jsonAntwort(401, ['message' => 'Bitte melde dich an.']);
}
$methode = $_SERVER['REQUEST_METHOD'];
$ressource = $_GET['resource'] ?? '';
$id = $_GET['id'] ?? null;
$erlaubt = ['products' => ['GET'], 'categories' => ['GET'],
    'product' => ['GET', 'PUT', 'DELETE'], 'category' => ['GET', 'POST', 'PATCH', 'DELETE']];
if (!is_string($ressource) || !isset($erlaubt[$ressource])) {
    jsonAntwort(404, ['message' => 'Diese Ansicht existiert nicht.']);
}
if (!in_array($methode, $erlaubt[$ressource], true)) {
    header('Allow: ' . implode(', ', $erlaubt[$ressource]));
    jsonAntwort(405, ['message' => 'Diese Aktion ist nicht verfügbar.']);
}
$einzeln = in_array($ressource, ['product', 'category'], true) && $methode !== 'POST';
if ($einzeln && (!is_string($id) || trim($id) === '' || strlen($id) > 128
    || preg_match('~[\x00-\x1F]~', $id)
    || ($ressource === 'category' && !preg_match('/^[1-9][0-9]*$/', $id)))) {
    jsonAntwort(400, ['message' => 'Die Artikelnummer oder Kategorie-ID ist ungültig.']);
}
$daten = null;
if ($methode !== 'GET') {
    pruefeCsrf();
}
if (in_array($methode, ['POST', 'PUT', 'PATCH'], true)) {
    $daten = leseJson();
    if (!is_string($daten['name'] ?? null) || trim($daten['name']) === ''
        || mb_strlen($daten['name']) > 255 || !in_array($daten['active'] ?? null, [0, 1], true)) {
        jsonAntwort(400, ['message' => 'Bitte gib einen Namen (maximal 255 Zeichen) und einen gültigen Status an.']);
    }
    $daten['name'] = trim($daten['name']);
    if ($ressource === 'product') {
        if (!is_int($daten['id_category'] ?? null) || $daten['id_category'] < 1
            || !is_int($daten['stock'] ?? null) || $daten['stock'] < 0
            || !is_numeric($daten['price'] ?? null) || $daten['price'] < 0
            || !is_string($daten['description'] ?? null) || !is_string($daten['image'] ?? null)) {
            jsonAntwort(400, ['message' => 'Prüfe Kategorie, Preis und Lagerbestand. Negative Werte sind nicht erlaubt.']);
        }
        if ($daten['image'] !== '' && (!filter_var($daten['image'], FILTER_VALIDATE_URL)
            || !in_array(strtolower(parse_url($daten['image'], PHP_URL_SCHEME) ?? ''), ['https', 'http'], true))) {
            jsonAntwort(400, ['message' => 'Die Bildadresse muss eine gültige HTTP- oder HTTPS-Adresse sein.']);
        }
        $daten = array_intersect_key($daten, array_flip(['active', 'id_category', 'name', 'image', 'description', 'price', 'stock']));
    } else {
        $daten = array_intersect_key($daten, array_flip(['active', 'name']));
    }
}
$pfad = '/' . $ressource . ($einzeln ? '/' . rawurlencode($id) : '');
$api = new ApiClient();
$antwort = $ressource === 'category' && $methode === 'POST'
    ? $api->erstelleKategorie($daten) : $api->anfragen($methode, $pfad, $daten);
if (!empty($antwort['partial'])) {
    jsonAntwort(502, ['message' => 'Die Kategorie wurde angelegt, aber nicht vollständig bestätigt. Öffne die Kategorienübersicht und prüfe den Status, bevor du erneut speicherst.']);
}
$status = $antwort['status'];
if ($status === 401) {
    unset($_SESSION['api_cookies']);
}
if ($status >= 400) {
    $meldungen = [400 => 'Die API hat die Angaben abgelehnt. Prüfe die Felder und die Kategorie.',
        401 => 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.',
        404 => 'Dieser Datensatz wurde nicht gefunden. Er wurde möglicherweise gelöscht.',
        409 => 'Die Änderung ist wegen eines Datenkonflikts nicht möglich.'];
    jsonAntwort($status >= 500 ? 502 : $status, ['message' => $meldungen[$status]
        ?? 'Die Schul-API konnte die Aktion nicht ausführen. Bitte versuche es erneut.']);
}
jsonAntwort($status, $antwort['data']);
