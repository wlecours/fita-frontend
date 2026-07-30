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

function closeAccountMenu() {
    document.getElementById("auth-account-menu")?.setAttribute("hidden", "");
    document.getElementById("auth-account-btn")?.setAttribute("aria-expanded", "false");
}

function toggleAccountMenu() {
    const menu = document.getElementById("auth-account-menu");
    const btn = document.getElementById("auth-account-btn");
    if (!menu || !btn) {
        return;
    }
    if (menu.hasAttribute("hidden")) {
        menu.removeAttribute("hidden");
        btn.setAttribute("aria-expanded", "true");
    } else {
        closeAccountMenu();
    }
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

function renderAuthNav() {
    const container = document.getElementById("auth-nav");
    if (!container) {
        return;
    }
    const auth = getAuth();
    if (auth) {
        container.innerHTML = `
            <div class="auth-account">
                <button type="button" id="auth-account-btn" class="auth-account-btn" aria-haspopup="true" aria-expanded="false" aria-label="Cuenta">
                    <svg class="auth-account-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.333 0-10 1.667-10 5v3h20v-3c0-3.333-6.667-5-10-5z"></path>
                    </svg>
                </button>
                <div class="auth-account-menu" id="auth-account-menu" hidden>
                    <div class="auth-account-header">
                        <p class="auth-account-header-name">${escapeHtml(auth.account.name)}</p>
                        <p class="auth-account-header-email">${escapeHtml(auth.account.email)}</p>
                    </div>
                    <div class="auth-account-menu-divider"></div>
                    <button type="button" class="auth-account-menu-item" id="auth-settings-btn">Configuración</button>
                    <button type="button" class="auth-account-menu-item" id="auth-logout-btn">Cerrar Sesión</button>
                </div>
            </div>
        `;
        document.getElementById("auth-account-btn").addEventListener("click", (event) => {
            event.stopPropagation();
            toggleAccountMenu();
        });
        document.getElementById("auth-settings-btn").addEventListener("click", closeAccountMenu);
        document.getElementById("auth-logout-btn").addEventListener("click", () => {
            closeAccountMenu();
            clearAuth();
        });
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

    document.addEventListener("click", (event) => {
        const menu = document.getElementById("auth-account-menu");
        const btn = document.getElementById("auth-account-btn");
        if (!menu || menu.hasAttribute("hidden")) {
            return;
        }
        if (!menu.contains(event.target) && event.target !== btn) {
            closeAccountMenu();
        }
    });

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
