"use strict";

// Browser-Controller: Navigation, AJAX und Darstellung. API-Daten werden als Text maskiert.
const content = document.querySelector("#content");
const message = document.querySelector("#meldung");
const csrf = document.querySelector('meta[name="csrf-token"]').content;
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const money = value => new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(Number(value));
const link = (view, id, action) => "?" + new URLSearchParams({ view, ...(id !== undefined ? { id } : {}), ...(action ? { action } : {}) });
const badge = active => Number(active) === 1 ? '<span class="badge">Aktiv</span>' : '<span class="badge inactive">Inaktiv</span>';
let generation = 0;
let pendingDelete = null;

function notify(text = "", error = false) {
    message.textContent = text;
    message.classList.toggle("error", error);
}

async function request(url, method = "GET", data) {
    let response;
    try {
        response = await fetch(url, {
            method, credentials: "same-origin",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
            ...(data !== undefined ? { body: JSON.stringify(data) } : {})
        });
    } catch {
        throw new Error("Keine Verbindung. Prüfe deine Internetverbindung und versuche es erneut.");
    }
    const result = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
        if (response.status === 401 && document.body.dataset.authenticated === "1") {
            // Die URL bleibt erhalten: Nach der Anmeldung geht es zur selben Detailseite.
            sessionStorage.setItem("notice", "Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.");
            location.reload();
        }
        const error = new Error(result?.message || "Die Anfrage konnte nicht ausgeführt werden.");
        error.status = response.status;
        throw error;
    }
    return result;
}
function api(resource, id, method = "GET", data) {
    return request("controllers/DataController.php?" + new URLSearchParams({
        resource, ...(id !== undefined ? { id } : {})
    }), method, data);
}

// Login und Logout verwenden dieselbe Fehlerbehandlung wie die Datenformulare.
document.querySelector("#loginForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const button = event.target.querySelector("button");
    button.disabled = true;
    notify("Anmeldung läuft …");
    try {
        await request("controllers/AuthController.php", "POST", {
            username: event.target.username.value.trim(), password: event.target.password.value
        });
        location.reload();
    } catch (error) {
        notify(error.message, true);
        button.disabled = false;
    }
});
document.querySelector("#logout")?.addEventListener("click", async event => {
    event.target.disabled = true;
    notify("Abmeldung läuft …");
    try {
        await request("controllers/LogoutController.php", "POST");
        location.href = "index.php";
    } catch (error) {
        notify(error.message, true);
        event.target.disabled = false;
    }
});

function navigate(url, notice = "") {
    history.pushState(null, "", url);
    render(notice);
}
document.addEventListener("click", event => {
    const anchor = event.target.closest("a");
    if (!content || !anchor || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (anchor.getAttribute("href")?.startsWith("?")) {
        event.preventDefault();
        navigate(anchor.href);
    }
});
window.addEventListener("popstate", () => render());

// Ein Zähler verhindert, dass eine langsame alte Antwort eine neue Ansicht überschreibt.
async function render(notice = "") {
    if (!content) return;
    const ticket = ++generation;
    const params = new URLSearchParams(location.search);
    const view = params.get("view") || "products";
    const id = params.get("id");
    const action = params.get("action");
    notify(notice);
    content.setAttribute("aria-busy", "true");
    content.innerHTML = "<p>Daten werden geladen …</p>";
    const product = view === "products" || view === "product";
    document.querySelectorAll("[data-nav]").forEach(anchor => {
        if (anchor.dataset.nav === (product ? "products" : "categories")) anchor.setAttribute("aria-current", "page");
        else anchor.removeAttribute("aria-current");
    });
    try {
        if (!["products", "categories", "product", "category"].includes(view)) throw new Error("Diese Seite existiert nicht.");
        if (view === "products" || view === "categories") {
            const rows = await api(view);
            if (!Array.isArray(rows)) throw new Error("Die API hat keine gültige Liste geliefert.");
            if (ticket !== generation) return;
            showList(view, rows);
        } else if (action === "new" || action === "edit") {
            if (action === "edit" && !id) throw new Error("Die Kennung des Datensatzes fehlt.");
            const [record, categories] = await Promise.all([
                action === "edit" ? api(view, id) : Promise.resolve({ active: 1, stock: 0 }),
                product ? api("categories") : Promise.resolve([])
            ]);
            if (ticket !== generation) return;
            showForm(view, id, record, categories, action);
        } else {
            if (!id) throw new Error("Die Kennung des Datensatzes fehlt.");
            const record = await api(view, id);
            const categories = product ? await api("categories") : [];
            if (ticket !== generation) return;
            showDetail(view, id, record, categories);
        }
        content.querySelector("h1")?.setAttribute("tabindex", "-1");
        content.querySelector("h1")?.focus({ preventScroll: true });
    } catch (error) {
        if (ticket !== generation) return;
        notify(error.message, true);
        content.innerHTML = '<div class="card"><h1>Ansicht nicht verfügbar</h1><p>Du kannst die Anfrage wiederholen oder zur Übersicht wechseln.</p><div class="actions"><button id="retry">Erneut versuchen</button><a href="?view=products">Zur Produktübersicht</a><a href="?view=categories">Zu den Kategorien</a></div></div>';
        content.querySelector("#retry").onclick = () => render();
    } finally {
        if (ticket === generation) content.setAttribute("aria-busy", "false");
    }
}

function showList(view, rows) {
    const product = view === "products";
    const singular = product ? "product" : "category";
    const label = product ? "Produkte" : "Kategorien";
    document.title = label + " · Produktverwaltung";
    content.innerHTML = `<div class="page-heading"><div><p class="eyebrow">SORTIMENT VERWALTEN</p><h1>${label}</h1><p class="muted">${rows.length} Einträge in deiner Übersicht</p></div><a class="button" href="${link(singular, undefined, "new")}">+ ${product ? "Produkt" : "Kategorie"} erstellen</a></div>
        <div class="toolbar"><div><label for="search">Suchen</label><input id="search" type="search" placeholder="${product ? "Name oder Artikelnummer" : "Name oder ID"}"></div><div><label for="status">Status</label><select id="status"><option value="">Alle Einträge</option><option value="1">Aktiv</option><option value="0">Inaktiv</option></select></div></div>
        <p id="count" class="muted" aria-live="polite"></p><div id="results"></div>`;
    const update = () => {
        const term = content.querySelector("#search").value.trim().toLocaleLowerCase("de");
        const status = content.querySelector("#status").value;
        const filtered = rows.filter(row => (String(row.name) + " " + String(product ? row.sku : row.category_id)).toLocaleLowerCase("de").includes(term)
            && (status === "" || String(row.active) === status));
        content.querySelector("#count").textContent = filtered.length + " von " + rows.length + " Einträgen";
        content.querySelector("#results").innerHTML = filtered.length ? `<div class="table-wrap"><table><thead><tr><th>Name</th>${product ? "<th>Preis</th><th>Bestand</th>" : ""}<th>Status</th><th>Aktion</th></tr></thead><tbody>${filtered.map(row => {
            const id = product ? row.sku : row.category_id;
            return `<tr><td><a href="${escapeHtml(link(singular, id))}">${escapeHtml(row.name)}</a><small>${product ? "SKU" : "ID"}: ${escapeHtml(id)}</small></td>${product ? `<td>${money(row.price)}</td><td>${escapeHtml(row.stock)}</td>` : ""}<td>${badge(row.active)}</td><td><a href="${escapeHtml(link(singular, id, "edit"))}" aria-label="${escapeHtml(row.name)} bearbeiten">Bearbeiten</a></td></tr>`;
        }).join("")}</tbody></table></div>` : '<div class="card empty"><h2>Keine Einträge gefunden</h2><p>Erstelle einen neuen Eintrag oder passe die Suche an.</p></div>';
    };
    content.querySelector("#search").addEventListener("input", update);
    content.querySelector("#status").addEventListener("change", update);
    update();
}

function showDetail(view, id, record, categories) {
    const product = view === "product";
    if (!record || typeof record !== "object") throw new Error("Die API hat keinen gültigen Datensatz geliefert.");
    document.title = record.name + " · Produktverwaltung";
    const category = categories.find(item => String(item.category_id) === String(record.id_category));
    const safeImage = /^https?:\/\//i.test(record.image || "") ? record.image : "";
    content.innerHTML = `<a href="${link(product ? "products" : "categories")}">← Zur Übersicht</a><div class="page-heading"><div><p class="eyebrow">${product ? "PRODUKTDETAILS" : "KATEGORIEDETAILS"}</p><h1>${escapeHtml(record.name)}</h1></div>${badge(record.active)}</div>
        <div class="card ${product ? "detail-layout" : ""}">${product ? `<div>${safeImage ? `<img class="product-image" src="${escapeHtml(safeImage)}" alt="${escapeHtml(record.name)}" referrerpolicy="no-referrer">` : '<div class="image-placeholder">Kein Produktbild</div>'}</div>` : ""}
        <div><dl><dt>${product ? "Artikelnummer" : "Kategorie-ID"}</dt><dd>${escapeHtml(id)}</dd>
        ${product ? `<dt>Preis</dt><dd>${money(record.price)}</dd><dt>Lagerbestand</dt><dd>${escapeHtml(record.stock)} Stück</dd><dt>Kategorie</dt><dd><a href="${escapeHtml(link("category", record.id_category))}">${escapeHtml(category?.name || record.id_category)}</a></dd>` : ""}</dl>
        ${product ? `<h2 style="margin-top:28px">Beschreibung</h2><p class="description">${escapeHtml(record.description || "Keine Beschreibung vorhanden.")}</p>` : ""}
        <div class="actions"><a class="button" href="${escapeHtml(link(view, id, "edit"))}">Bearbeiten</a><button id="delete" class="danger">Löschen</button><button id="copy-link" class="secondary">Link kopieren</button></div></div></div>`;
    content.querySelector("img")?.addEventListener("error", event => {
        const placeholder = document.createElement("div");
        placeholder.className = "image-placeholder";
        placeholder.textContent = "Bild nicht verfügbar";
        event.target.replaceWith(placeholder);
    });
    content.querySelector("#copy-link").onclick = async () => {
        try { await navigator.clipboard.writeText(location.href); notify("Der Link wurde kopiert."); }
        catch { notify("Kopiere den Link aus der Adresszeile deines Browsers."); }
    };
    content.querySelector("#delete").onclick = () => {
        pendingDelete = { view, id };
        document.querySelector("#delete-description").textContent = "«" + record.name + "» wirklich löschen?" + (!product ? " Prüfe vorher, ob Produkte diese Kategorie noch verwenden." : "");
        document.querySelector("#delete-error").textContent = "";
        document.querySelector("#delete-dialog").showModal();
        document.querySelector("#cancel-delete").focus();
    };
}

function showForm(view, id, record, categories, action) {
    const product = view === "product";
    const editing = action === "edit";
    const title = (product ? "Produkt" : "Kategorie") + (editing ? " bearbeiten" : " erstellen");
    document.title = title + " · Produktverwaltung";
    const field = (name, label, type = "text", attrs = "") => `<div><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${escapeHtml(record[name] ?? "")}" ${attrs}></div>`;
    content.innerHTML = `<a href="${editing ? escapeHtml(link(view, id)) : link(product ? "products" : "categories")}">← Zurück</a><h1>${title}</h1><p class="muted">Felder mit * sind Pflichtfelder.</p>
        <form id="record-form" class="card form-card"><div class="form-grid">
        ${product ? `<div><label for="sku">Artikelnummer (SKU) *</label><input id="sku" name="sku" required maxlength="128" value="${escapeHtml(editing ? id : "")}" ${editing ? "readonly" : ""}><small class="hint">Eindeutig und ohne Leerzeichen, /, \\, ? oder #. Nach dem Erstellen nicht änderbar.</small></div>` : ""}
        ${field("name", "Name *", "text", 'required maxlength="255"')}
        <div><label for="active">Status *</label><select id="active" name="active"><option value="1" ${Number(record.active) === 1 ? "selected" : ""}>Aktiv</option><option value="0" ${Number(record.active) !== 1 ? "selected" : ""}>Inaktiv</option></select></div>
        ${product ? `<div><label for="id_category">Kategorie *</label><select id="id_category" name="id_category" required><option value="">Kategorie wählen</option>${categories.map(category => `<option value="${escapeHtml(category.category_id)}" ${String(category.category_id) === String(record.id_category) ? "selected" : ""}>${escapeHtml(category.name)}${Number(category.active) !== 1 ? " (inaktiv)" : ""}</option>`).join("")}</select>${!categories.length ? '<small class="hint">Erstelle zuerst eine <a href="?view=category&action=new">Kategorie</a>.</small>' : ""}</div>
        ${field("price", "Preis in CHF *", "number", 'required min="0" step="0.01"')}${field("stock", "Lagerbestand *", "number", 'required min="0" step="1"')}
        <div class="full">${field("image", "Bildadresse (optional)", "url", 'placeholder="https://…"')}<small class="hint">Öffentlich erreichbare HTTP- oder HTTPS-Adresse eines Bildes.</small></div>
        <div class="full"><label for="description">Beschreibung</label><textarea id="description" name="description">${escapeHtml(record.description)}</textarea></div>` : ""}
        </div><div class="actions"><button type="submit">${editing ? "Änderungen speichern" : "Erstellen"}</button><a class="button secondary" href="${editing ? escapeHtml(link(view, id)) : link(product ? "products" : "categories")}">Abbrechen</a></div></form>`;
    content.querySelector("#record-form").addEventListener("submit", async event => {
        event.preventDefault();
        const form = event.target;
        const button = form.querySelector('button[type="submit"]');
        const values = Object.fromEntries(new FormData(form));
        const data = { name: values.name.trim(), active: Number(values.active) };
        if (!data.name) { notify("Bitte gib einen Namen ein.", true); return; }
        let key = id;
        if (product) {
            key = editing ? id : values.sku.trim();
            if (!key || (!editing && /[\s/\\?#]/.test(key))) { notify("Bitte gib eine gültige Artikelnummer ohne Leerzeichen, /, \\, ? oder # ein.", true); return; }
            Object.assign(data, { id_category: Number(values.id_category), price: Number(values.price),
                stock: Number(values.stock), image: values.image.trim(), description: values.description.trim() });
        }
        button.disabled = true;
        notify("Wird gespeichert …");
        try {
            // PUT würde eine vorhandene SKU überschreiben; vor dem Anlegen prüfen.
            if (product && !editing) {
                let exists = false;
                try { await api("product", key); exists = true; }
                catch (error) { if (error.status !== 404) throw error; }
                if (exists) throw new Error("Diese Artikelnummer existiert bereits. Wähle eine andere oder bearbeite das bestehende Produkt.");
            }
            const result = await api(view, key, product ? "PUT" : (editing ? "PATCH" : "POST"), data);
            const targetId = product ? key : (editing ? id : result?.category_id);
            navigate(targetId !== undefined ? link(view, targetId) : link("categories"), "Erfolgreich gespeichert.");
        } catch (error) {
            notify(error.message, true);
            button.disabled = false;
        }
    });
}

document.querySelector("#cancel-delete")?.addEventListener("click", () => document.querySelector("#delete-dialog").close());
document.querySelector("#confirm-delete")?.addEventListener("click", async event => {
    if (!pendingDelete) return;
    const button = event.target;
    const dialog = document.querySelector("#delete-dialog");
    button.disabled = true;
    document.querySelector("#cancel-delete").disabled = true;
    try {
        await api(pendingDelete.view, pendingDelete.id, "DELETE");
        dialog.close();
        navigate(link(pendingDelete.view === "product" ? "products" : "categories"), "Der Datensatz wurde gelöscht.");
    } catch (error) {
        document.querySelector("#delete-error").textContent = error.message;
    } finally {
        button.disabled = false;
        document.querySelector("#cancel-delete").disabled = false;
    }
});
document.querySelector("#delete-dialog")?.addEventListener("cancel", event => {
    if (document.querySelector("#confirm-delete").disabled) event.preventDefault();
});
if (content) render();
else {
    const notice = sessionStorage.getItem("notice");
    if (notice) { notify(notice, true); sessionStorage.removeItem("notice"); }
}
