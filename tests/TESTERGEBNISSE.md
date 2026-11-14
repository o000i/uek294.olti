# Testergebnisse

Stand: 14.11.2026. Umgebung: Windows, XAMPP mit PHP 8.2.12, Microsoft Edge, echte CsBe-Schul-API.

## Erfolgreiche Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Syntax aller neun PHP-Dateien | Bestanden mit `php -l` |
| JavaScript-Syntax | Bestanden mit `node --check assets/app.js` |
| Zugriff ohne Anmeldung | HTTP 401 |
| Anmeldung über lokalen PHP-Controller | HTTP 204; Sitzung bleibt nach Neuladen erhalten |
| Produkt- und Kategorienlisten | HTTP 200; echte API-Daten abrufbar |
| Produkt- und Kategoriedetails | HTTP 200 |
| Ungültige Formulardaten | HTTP 400 vor API-Schreibzugriff |
| Falsches CSRF-Token | HTTP 403 |
| Kategorie erstellen | Neu angelegte Kategorie vorhanden; Status aktiv korrekt übernommen |
| Kategorie bearbeiten | Name und Status korrekt geändert |
| Produkt erstellen | SKU, Name, aktiver Status und Daten korrekt abrufbar |
| Produkt bearbeiten | Preisänderung von CHF 12.95 auf CHF 14.50 bestätigt |
| Permalink | Detailansicht nach Neuladen weiterhin erreichbar |
| HTML-Sonderzeichen | Produktname und Beschreibung als Text dargestellt |
| Löschung abbrechen | Produkt bleibt vorhanden |
| Produkt löschen | Anschliessender Abruf HTTP 404 |
| Kategorie löschen | Anschliessender Abruf HTTP 404 |
| Abmelden | Loginseite sichtbar; anschliessender Datenabruf HTTP 401 |
| JavaScript-Laufzeit | Keine unbehandelten Browserfehler während der Testabläufe |
| Handyansicht | Detailansicht bei 390 Pixeln ohne horizontalen Seitenüberlauf |
| Dokumentation | Zehn Seiten erzeugt und gerendert; Seitenaufteilung und Layout visuell geprüft |

Die Schreibtests verwendeten eigene Datensätze mit den Präfixen `Olti Test` und `OLTI-TEST-` sowie Zeitstempel. Diese Testdatensätze wurden nach den Prüfungen gelöscht. Auch die zu Beginn der Prüfung angelegte Kategorie `test` (ID 82) wurde wieder entfernt. Vorhandene reguläre Produkte und Kategorien wurden nicht bearbeitet oder gelöscht.

## Gefundene und behobene Besonderheiten

- Das ursprüngliche Login-JavaScript enthielt eine überzählige schliessende Klammer.
- Die API liefert beim Anlegen einer Kategorie kein Objekt zurück und übernimmt den aktiven Status nicht zuverlässig. Das Model identifiziert den eindeutig neuen Eintrag und korrigiert den Status per PATCH. Der korrigierte Ablauf wurde erneut vollständig getestet.
- Bestehende SKUs enthalten teilweise Leerzeichen. Der lokale Datencontroller akzeptiert solche Kennungen; die SKU wird beim Bearbeiten nicht verändert. Die neue Anlage beschränkt sich auf eindeutige, einfach verwendbare Artikelnummern.
- Der erste CSRF-Test verwendete unbeabsichtigt einen im HTTP-Testclient gespeicherten Header. Die Wiederholung mit einem ausdrücklich ungültigen Token ergab korrekt HTTP 403.

## Noch manuell zu prüfen

- Persönliches Arbeitsjournal und Reflexionen vervollständigen.
- Konkrete Abgabefrist, geforderter Repository-Umfang und öffentliche Sichtbarkeit prüfen.
- Vollständige Tastaturbedienung und Erklärung des Codes für das Fachgespräch üben.
- Gleichzeitige Änderungen mehrerer Benutzer und längere API-Ausfälle wurden nicht umfassend simuliert.
