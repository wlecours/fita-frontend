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

function adminPanelUrl() {
    return window.location.pathname.includes("/pages/") ? "administracion-fita.html" : "pages/administracion-fita.html";
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
                        <span class="auth-account-header-avatar">
                            <svg class="auth-account-header-avatar-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.333 0-10 1.667-10 5v3h20v-3c0-3.333-6.667-5-10-5z"></path>
                            </svg>
                        </span>
                        <div class="auth-account-header-text">
                            <p class="auth-account-header-name">${escapeHtml(auth.account.name)}</p>
                            <p class="auth-account-header-email">${escapeHtml(auth.account.email)}</p>
                        </div>
                    </div>
                    <div class="auth-account-menu-divider"></div>
                    ${auth.account.role === "ADMIN" ? `
                    <button type="button" class="auth-account-menu-item" id="auth-admin-btn">
                        <span class="auth-account-menu-icon-wrap">
                            <svg class="auth-account-menu-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"></path>
                            </svg>
                        </span>
                        <span>Panel de Administración</span>
                    </button>
                    <div class="auth-account-menu-divider"></div>
                    ` : ""}
                    <button type="button" class="auth-account-menu-item" id="auth-settings-btn">
                        <span class="auth-account-menu-icon-wrap">
                            <svg class="auth-account-menu-icon" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
                                <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"></path>
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
        document.getElementById("auth-admin-btn")?.addEventListener("click", () => {
            closeAccountMenu();
            window.location.href = adminPanelUrl();
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
