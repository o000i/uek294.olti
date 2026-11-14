<?php

// Views enthalten nur die Grundstruktur; AJAX lädt die geschützten Daten nach.
function zeigeStartseite(): void
{
    require __DIR__ . '/../views/home.php';
}
function zeigeLogin(): void
{
    require __DIR__ . '/../views/login.php';
}
