<section class="login-layout">
    <div><p class="eyebrow">DEIN SORTIMENT IM ÜBERBLICK</p><h1>Alles an<br>einem Ort.</h1>
        <p class="lead">Produkte pflegen, Kategorien ordnen und den Lagerbestand im Blick behalten.</p>
        <div class="intro-note">Melde dich mit deinen Zugangsdaten für die Schul-API an.</div>
    </div>
    <div class="card login-card">
        <h2>Willkommen zurück</h2><p class="muted">Anmelden und Sortiment verwalten.</p>
        <form id="loginForm">
            <label for="username">Benutzername</label>
            <input id="username" name="username" autocomplete="username" required autofocus>
            <label for="password">Passwort</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required>
            <button type="submit">Anmelden</button>
        </form>
        <p id="meldung" role="status" aria-live="polite"></p>
    </div>
</section>
<noscript>Bitte aktiviere JavaScript, um dich anzumelden.</noscript>
