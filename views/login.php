<h2>Login</h2>

<form id="loginForm">
    <label>Benutzername:</label>
    <input type="text" id="username" required>

    <br><br>

    <label>Passwort:</label>
    <input type="password" id="password" required>

    <br><br>

    <button type="submit">Anmelden</button>
</form>

<p id="meldung"></p>

<script>
document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const meldung = document.getElementById("meldung");

    meldung.textContent = "Anmeldung läuft...";

    try {
        const antwort = await fetch(
            "/projekt294/controllers/AuthController.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ username, password })
            }
        );

        if (antwort.status === 204) {
            meldung.textContent = "Anmeldung erfolgreich!";
        } else if (antwort.status === 401) {
            meldung.textContent = "Falsche Zugangsdaten.";
        } else {
            meldung.textContent = "Fehler bei der Anmeldung.";
        }
    } catch (fehler) {
        meldung.textContent = "Verbindung zur API fehlgeschlagen.";
    }
});
</script>
