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
                    <button type="button" class="auth-account-menu-item" id="auth-settings-btn">
                        <span class="auth-account-menu-icon-wrap">
                            <svg class="auth-account-menu-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M19.14,12.94c0.04,-0.3 0.06,-0.61 0.06,-0.94c0,-0.32 -0.02,-0.64 -0.07,-0.94l2.03,-1.58c0.18,-0.14 0.23,-0.41 0.12,-0.61l-1.92,-3.32c-0.12,-0.22 -0.37,-0.29 -0.59,-0.22l-2.39,0.96c-0.5,-0.38 -1.03,-0.7 -1.62,-0.94L14.4,2.81c-0.04,-0.24 -0.24,-0.41 -0.48,-0.41h-3.84c-0.24,0 -0.43,0.17 -0.47,0.41L9.25,5.35C8.66,5.59 8.12,5.92 7.63,6.29L5.24,5.33c-0.22,-0.08 -0.47,0 -0.59,0.22L2.74,8.87C2.62,9.08 2.66,9.34 2.86,9.48l2.03,1.58C4.84,11.36 4.8,11.69 4.8,12s0.02,0.64 0.07,0.94l-2.03,1.58c-0.18,0.14 -0.23,0.41 -0.12,0.61l1.92,3.32c0.12,0.22 0.37,0.29 0.59,0.22l2.39,-0.96c0.5,0.38 1.03,0.7 1.62,0.94l0.36,2.54c0.05,0.24 0.24,0.41 0.48,0.41h3.84c0.24,0 0.44,-0.17 0.47,-0.41l0.36,-2.54c0.59,-0.24 1.13,-0.56 1.62,-0.94l2.39,0.96c0.22,0.08 0.47,0 0.59,-0.22l1.92,-3.32c0.12,-0.22 0.07,-0.47 -0.12,-0.61L19.14,12.94zM12,15.6c-1.98,0 -3.6,-1.62 -3.6,-3.6s1.62,-3.6 3.6,-3.6s3.6,1.62 3.6,3.6S13.98,15.6 12,15.6z"></path>
                            </svg>
                        </span>
                        <span>Configuración</span>
                    </button>
                    <button type="button" class="auth-account-menu-item" id="auth-logout-btn">
                        <span class="auth-account-menu-icon-wrap">
                            <svg class="auth-account-menu-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"></path>
                            </svg>
                        </span>
                        <span>Cerrar Sesión</span>
                    </button>
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
