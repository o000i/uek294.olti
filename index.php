<?php
require_once 'controllers/HomeController.php';
?>

<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Produktverwaltung</title>
</head>
<body>

<?php
if (isset($_GET['page']) && $_GET['page'] == 'login') {
    zeigeLogin();
} else {
    zeigeStartseite();
}
?>

</body>
</html>