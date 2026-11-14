<?php
declare(strict_types=1);
// Model: HTTP-Kommunikation mit der vorgegebenen API, ohne Zugangsdaten im Code.
class ApiClient
{
    private const BASIS = 'https://campus.csbe.ch/uek294/api/v1';

    public function erstelleKategorie(array $daten): array
    {
        // Die Schul-API liefert bei POST kein Objekt und ignoriert dabei active.
        // Nur eine eindeutig neu hinzugekommene Kategorie darf korrigiert werden.
        $vorher = $this->anfragen('GET', '/categories');
        if ($vorher['status'] !== 200 || !is_array($vorher['data'])) {
            return ['status' => 502, 'data' => null, 'cookies' => []];
        }
        $ids = array_map('strval', array_column($vorher['data'], 'category_id'));
        $erstellt = $this->anfragen('POST', '/category', $daten);
        if ($erstellt['status'] !== 201) {
            return $erstellt;
        }
        $nachher = $this->anfragen('GET', '/categories');
        $neu = array_values(array_filter(is_array($nachher['data']) ? $nachher['data'] : [],
            fn ($eintrag) => !in_array((string) $eintrag['category_id'], $ids, true)
                && $eintrag['name'] === $daten['name']));
        if (count($neu) !== 1) {
            return ['status' => 502, 'data' => null, 'cookies' => [], 'partial' => true];
        }
        $kategorie = $neu[0];
        if ((int) $kategorie['active'] !== $daten['active']) {
            $korrektur = $this->anfragen('PATCH', '/category/' . rawurlencode((string) $kategorie['category_id']), $daten);
            if ($korrektur['status'] < 200 || $korrektur['status'] >= 300) {
                return ['status' => 502, 'data' => null, 'cookies' => [], 'partial' => true];
            }
            $kategorie['active'] = $daten['active'];
        }
        return ['status' => 201, 'data' => $kategorie, 'cookies' => []];
    }

    public function anfragen(string $methode, string $pfad, ?array $daten = null): array
    {
        $curl = curl_init(self::BASIS . $pfad);
        $cookies = [];
        $optionen = [
            CURLOPT_CUSTOMREQUEST => $methode,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => ['Accept: application/json', 'Content-Type: application/json'],
            CURLOPT_HEADERFUNCTION => function ($curl, string $zeile) use (&$cookies): int {
                if (stripos($zeile, 'Set-Cookie:') === 0) {
                    $cookies[] = explode(';', trim(substr($zeile, 11)))[0];
                }
                return strlen($zeile);
            },
        ];
        if (!empty($_SESSION['api_cookies'])) {
            $optionen[CURLOPT_COOKIE] = $_SESSION['api_cookies'];
        }
        if ($daten !== null) {
            $optionen[CURLOPT_POSTFIELDS] = json_encode($daten, JSON_THROW_ON_ERROR);
        }
        curl_setopt_array($curl, $optionen);
        $inhalt = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        if ($inhalt === false || $status === 0) {
            return ['status' => 502, 'data' => null, 'cookies' => []];
        }
        return ['status' => $status, 'data' => json_decode($inhalt, true), 'cookies' => $cookies];
    }
}
