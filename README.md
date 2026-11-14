# Produktverwaltung – üK 294

PHP-8-Webfrontend für die vorgegebene CsBe-Shop-API, mit Produkten und Kategorien.

## Starten

1. Den Ordner `projekt294` im XAMPP-Verzeichnis `htdocs` ablegen.
2. Apache in XAMPP starten. PHP benötigt die Erweiterung cURL.
3. [Anwendung öffnen](http://localhost/projekt294/).
4. Mit den im Unterricht bereitgestellten API-Zugangsdaten anmelden.

Für das Frontend ist keine eigene Datenbank einzurichten. Die Schul-API übernimmt die dauerhafte Speicherung. Zugangsdaten und API-Token gehören nicht ins Repository.

## Funktionen

- Anmeldung und Abmeldung mit serverseitiger Sitzung
- Produkte und Kategorien erstellen, auflisten, ansehen, bearbeiten und löschen
- Suche nach Name und Kennung sowie Statusfilter
- Direkte Links zu Produkten und Kategorien, auch nach erneutem Anmelden
- Eingabeprüfung, Fehlermeldungen und Löschbestätigung
- Anpassung an schmale Bildschirme

Beispiele für Direktlinks: `index.php?view=product&id=ABC123` und `index.php?view=category&id=1`. Die Kennungen müssen tatsächlich existieren.

## Aufbau

`index.php` bildet den Seitenrahmen. `controllers/` prüft Anfragen und steuert Views beziehungsweise Datenoperationen. `models/ApiClient.php` kommuniziert mit der API. `views/` enthält die HTML-Grundstruktur. `assets/` enthält JavaScript und CSS. `bootstrap.php` kapselt Sitzung, CSRF-Schutz und JSON-Antworten.

Die neue Kategorie wird nach dem Anlegen eindeutig über den Vergleich alter und neuer IDs zugeordnet. Dies gleicht zwei beobachtete API-Abweichungen aus: POST liefert kein Objekt zurück und setzt den angeforderten aktiven Status nicht korrekt. Bei mehrdeutiger Zuordnung wird keine fremde Kategorie verändert.

## Dokumentation

- `docs/Projektdokumentation_Arbeitsfassung.pdf`: PDF mit Aufbau, Storyboard, API, Tests und Journalvorlage.
- `docs/Projektdokumentation.md`: lesbare Textfassung.
- `scripts/build_docs.py`: erzeugt beide Fassungen; benötigt Python und ReportLab. Inhaltliche Anpassungen vor einer Neuerzeugung hier vornehmen, da die Markdown-Datei dabei überschrieben wird.
- `docs/images/`: Abbildungen aus der Anwendung.

Das Arbeitsjournal enthält belegte Git-Schritte vom 07.11.2026 und den aktuellen Projektstand. Tatsächliche persönliche Arbeitszeiten und eigene Reflexionen fehlen noch und müssen ergänzt werden. Git-Zeitstempel sind kein Nachweis von Arbeitsdauern.

## Tests

Der Browsertest `tests/browser.cjs` benötigt Node.js, Playwright und Microsoft Edge. Die Anwendung muss bereits erreichbar sein. Die Umgebungsvariablen `TEST_USERNAME` und `TEST_PASSWORD` werden nur für den Testprozess gesetzt. Optional können `PROJECT_URL` und `PLAYWRIGHT_PATH` angepasst werden. Start: `node tests/browser.cjs`.

Der Test legt eindeutig mit Zeitstempel benannte Testdatensätze in der echten API an, prüft die Abläufe und entfernt diese wieder. Nur in der dafür vorgesehenen Schulumgebung ausführen. Ergebnisse der durchgeführten Prüfung: `tests/TESTERGEBNISSE.md`.

## Bekannte Grenzen

- Die Verfügbarkeit der Schul-API ist Voraussetzung.
- Die API bietet keine atomare Prüfung zum ausschliesslichen Anlegen einer neuen SKU. Bei gleichzeitiger Anlage derselben SKU bleibt trotz Vorabprüfung ein Konkurrenzrisiko.
- Das Verhalten beim Löschen einer Kategorie mit zugeordneten Produkten bestimmt die API. Die Oberfläche weist darauf hin.
- Die Dokumentation ist bis zur Ergänzung des persönlichen Journals eine Arbeitsfassung.

## Abgabe

Vor der Abgabe Journal und Reflexionen ergänzen, die letzte Version prüfen, Änderungen committen und pushen sowie die geforderte öffentliche Repository-Sichtbarkeit kontrollieren. PDF und Repository-Link gemäss Auftrag rechtzeitig via Teams abgeben. Automatische Veröffentlichung oder Einreichung erfolgt nicht.

## Fachliche Quellen

- Projektauftrag und Bewertungsraster von Manuel Sollberger, 20.10.2026, bereitgestellt im Unterricht.
- [Shop-API-Dokumentation](https://campus.csbe.ch/uek294/api/v1/public/swagger-ui/index.html), abgerufen am 14.11.2026.
