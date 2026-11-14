<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/controllers/HomeController.php';
$eingeloggt = !empty($_SESSION['api_cookies']);
?>
<!DOCTYPE html>
<html lang="de-CH">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?= htmlspecialchars($_SESSION['csrf'], ENT_QUOTES, 'UTF-8') ?>">
    <title>Produktverwaltung · üK 294</title>
    <link rel="stylesheet" href="assets/style.css">
    <script src="assets/app.js" defer></script>
</head>
<body data-authenticated="<?= $eingeloggt ? '1' : '0' ?>">
<a class="skip-link" href="#main">Zum Inhalt</a>
<header class="header">
    <a class="brand" href="index.php"><span class="brand-icon">P</span> Produktverwaltung <small>üK 294</small></a>
    <?php if ($eingeloggt): ?>
        <button class="secondary" id="logout" type="button">Abmelden</button>
    <?php endif; ?>
</header>
<main id="main" tabindex="-1">
    <?php $eingeloggt ? zeigeStartseite() : zeigeLogin(); ?>
</main>
<footer>Produktverwaltung · Olti Ismajlaj · üK 294</footer>
</body>
</html>
