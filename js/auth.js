const AUTH_STORAGE_KEY = "fita-auth";

function getAuth() {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function setAuth(auth) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    document.dispatchEvent(new CustomEvent("authchange", { detail: { auth } }));
}

function clearAuth() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    document.dispatchEvent(new CustomEvent("authchange", { detail: { auth: null } }));
}

function setAuthError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
    }
}

function showAuthView(viewToShow, viewToHide) {
    document.getElementById(viewToHide).hidden = true;
    document.getElementById(viewToShow).hidden = false;
}

function openAuthModal() {
    const overlay = document.getElementById("auth-modal");
    if (!overlay) {
        return;
    }
    showAuthView("auth-login-view", "auth-register-view");
    overlay.hidden = false;
}

function closeAuthModal() {
    const overlay = document.getElementById("auth-modal");
    if (!overlay) {
        return;
    }
    overlay.hidden = true;
    document.getElementById("auth-login-form")?.reset();
    document.getElementById("auth-register-form")?.reset();
    setAuthError("auth-login-error", "");
    setAuthError("auth-register-error", "");
}

function renderAuthNav() {
    const container = document.getElementById("auth-nav");
    if (!container) {
        return;
    }
    const auth = getAuth();
    if (auth) {
        container.innerHTML = `
            <span class="auth-account-name">Hola, ${auth.account.name}</span>
            <button type="button" id="auth-logout-btn" class="auth-logout-btn">Cerrar Sesión</button>
        `;
        document.getElementById("auth-logout-btn").addEventListener("click", clearAuth);
    } else {
        container.innerHTML = `<button type="button" id="auth-open-btn" class="auth-trigger-btn">Iniciar Sesión</button>`;
        document.getElementById("auth-open-btn").addEventListener("click", openAuthModal);
    }
}

async function handleAuthSubmit(event, url, errorElementId, buildPayload) {
    event.preventDefault();
    setAuthError(errorElementId, "");
    try {
        const response = await fetch(`${CONFIG.API_URL}${url}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildPayload(event.target))
        });
        const data = await response.json();
        if (!response.ok) {
            setAuthError(errorElementId, data.message || "Ocurrió un error, intenta de nuevo");
            return;
        }
        setAuth(data);
        closeAuthModal();
    } catch (e) {
        setAuthError(errorElementId, "No se pudo conectar con el servidor");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderAuthNav();

    document.querySelector('#auth-register-form input[name="phone"]')?.addEventListener("input", (event) => {
        event.target.value = event.target.value.replace(/[^0-9+]/g, "");
    });

    document.getElementById("auth-modal-close")?.addEventListener("click", closeAuthModal);
    document.getElementById("auth-modal")?.addEventListener("click", (event) => {
        if (event.target.id === "auth-modal") {
            closeAuthModal();
        }
    });
    document.getElementById("auth-show-register")?.addEventListener("click", () => showAuthView("auth-register-view", "auth-login-view"));
    document.getElementById("auth-show-login")?.addEventListener("click", () => showAuthView("auth-login-view", "auth-register-view"));

    document.getElementById("auth-login-form")?.addEventListener("submit", (event) =>
        handleAuthSubmit(event, "/api/accounts/login", "auth-login-error", (form) => ({
            email: form.email.value,
            password: form.password.value
        }))
    );

    document.getElementById("auth-register-form")?.addEventListener("submit", (event) =>
        handleAuthSubmit(event, "/api/accounts/register", "auth-register-error", (form) => ({
            email: form.email.value,
            name: form.name.value,
            password: form.password.value,
            phone: form.phone.value,
            address: form.address.value || null
        }))
    );
});

document.addEventListener("authchange", renderAuthNav);
