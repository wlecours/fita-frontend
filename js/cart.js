const CART_GUEST_KEY = "fita-cart-guest";
const CATALOG_LABELS = { PRODUCT: "Producto", MENU: "Menú" };

let cartView = { items: [], total: 0, currency: "USD" };
let cartPanelOpen = false;

function cartIsLoggedIn() {
    return !!getAuth();
}

function imgBasePath() {
    return window.location.pathname.includes("/pages/") ? "../img/" : "img/";
}

function checkoutUrl() {
    return window.location.pathname.includes("/pages/") ? "checkout.html" : "pages/checkout.html";
}

function readGuestCartItems() {
    const raw = localStorage.getItem(CART_GUEST_KEY);
    if (!raw) {
        return [];
    }
    try {
        const items = JSON.parse(raw);
        return Array.isArray(items) ? items : [];
    } catch (e) {
        return [];
    }
}

function writeGuestCartItems(items) {
    if (items.length === 0) {
        localStorage.removeItem(CART_GUEST_KEY);
        return;
    }
    localStorage.setItem(CART_GUEST_KEY, JSON.stringify(items));
}

async function apiCartRequest(path, options = {}) {
    const auth = getAuth();
    const response = await fetch(`${CONFIG.API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(auth ? { Authorization: `Bearer ${auth.token}` } : {}),
            ...(options.headers || {})
        }
    });
    if (!response.ok) {
        throw new Error(`Cart request failed: ${response.status}`);
    }
    return response.json();
}

async function resolveCatalogItem(catalogType, itemId, currency) {
    const path = catalogType === "PRODUCT" ? `/api/products/${itemId}` : `/api/menu-items/${itemId}`;
    try {
        const response = await fetch(`${CONFIG.API_URL}${path}?currency=${currency}`);
        if (!response.ok) {
            return null;
        }
        return response.json();
    } catch (e) {
        return null;
    }
}

async function buildGuestCartView(currency) {
    const guestItems = readGuestCartItems();
    const resolved = await Promise.all(guestItems.map(async (item) => {
        const details = await resolveCatalogItem(item.catalogType, item.itemId, currency);
        if (!details) {
            return null;
        }
        const lineTotal = details.price * item.quantity;
        return {
            key: `${item.catalogType}:${item.itemId}`,
            catalogType: item.catalogType,
            itemId: item.itemId,
            name: details.name,
            imageUrl: details.imageUrl,
            price: details.price,
            quantity: item.quantity,
            lineTotal
        };
    }));
    const items = resolved.filter(Boolean);
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
    return { items, total, currency };
}

async function buildAccountCartView(currency) {
    const data = await apiCartRequest(`/api/cart?currency=${currency}`);
    return {
        items: data.items.map((item) => ({
            key: String(item.cartItemId),
            catalogType: item.catalogType,
            itemId: item.itemId,
            name: item.name,
            imageUrl: item.imageUrl,
            price: item.price,
            quantity: item.quantity,
            lineTotal: item.lineTotal
        })),
        total: data.total,
        currency: data.currency
    };
}

async function refreshCart() {
    const currency = getCurrency();
    try {
        cartView = cartIsLoggedIn() ? await buildAccountCartView(currency) : await buildGuestCartView(currency);
    } catch (e) {
        console.error(e);
        cartView = { items: [], total: 0, currency };
    }
    renderCartBadge();
    if (cartPanelOpen) {
        renderCartPanelItems();
    }
}

async function addToCart(catalogType, itemId, quantity = 1) {
    if (cartIsLoggedIn()) {
        await apiCartRequest(`/api/cart/items?currency=${getCurrency()}`, {
            method: "POST",
            body: JSON.stringify({ catalogType, itemId, quantity })
        });
    } else {
        const items = readGuestCartItems();
        const existing = items.find((item) => item.catalogType === catalogType && item.itemId === itemId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            items.push({ catalogType, itemId, quantity });
        }
        writeGuestCartItems(items);
    }
    await refreshCart();
}

async function setCartItemQuantity(key, catalogType, itemId, quantity) {
    if (cartIsLoggedIn()) {
        if (quantity < 1) {
            await apiCartRequest(`/api/cart/items/${key}?currency=${getCurrency()}`, { method: "DELETE" });
        } else {
            await apiCartRequest(`/api/cart/items/${key}?currency=${getCurrency()}`, {
                method: "PUT",
                body: JSON.stringify({ quantity })
            });
        }
    } else {
        let items = readGuestCartItems();
        if (quantity < 1) {
            items = items.filter((item) => !(item.catalogType === catalogType && item.itemId === itemId));
        } else {
            const existing = items.find((item) => item.catalogType === catalogType && item.itemId === itemId);
            if (existing) {
                existing.quantity = quantity;
            }
        }
        writeGuestCartItems(items);
    }
    await refreshCart();
}

async function removeCartItem(key, catalogType, itemId) {
    await setCartItemQuantity(key, catalogType, itemId, 0);
}

function cartItemCount() {
    return cartView.items.reduce((sum, item) => sum + item.quantity, 0);
}

function renderCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) {
        return;
    }
    const count = cartItemCount();
    badge.textContent = String(count);
    badge.hidden = count === 0;
}

function bumpCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) {
        return;
    }
    badge.classList.remove("cart-badge-bump");
    void badge.offsetWidth;
    badge.classList.add("cart-badge-bump");
}

function pulseAddButton(button) {
    button.classList.remove("add-to-cart-pulse");
    void button.offsetWidth;
    button.classList.add("add-to-cart-pulse");
    button.addEventListener("animationend", () => button.classList.remove("add-to-cart-pulse"), { once: true });
}

function closeCartPanel() {
    cartPanelOpen = false;
    document.getElementById("cart-panel")?.setAttribute("hidden", "");
    document.getElementById("cart-btn")?.setAttribute("aria-expanded", "false");
}

function openCartPanel() {
    cartPanelOpen = true;
    document.getElementById("cart-panel")?.removeAttribute("hidden");
    document.getElementById("cart-btn")?.setAttribute("aria-expanded", "true");
    renderCartPanelItems();
}

function toggleCartPanel() {
    if (cartPanelOpen) {
        closeCartPanel();
    } else {
        openCartPanel();
    }
}

const CURRENCY_SYMBOLS_CART = { USD: "$", VES: "Bs." };

function renderCartPanelItems() {
    const body = document.getElementById("cart-panel-body");
    const footer = document.getElementById("cart-panel-footer");
    if (!body || !footer) {
        return;
    }
    if (cartView.items.length === 0) {
        body.innerHTML = `<p class="cart-empty">Tu carrito está vacío.</p>`;
        footer.innerHTML = "";
        return;
    }
    const symbol = CURRENCY_SYMBOLS_CART[cartView.currency] ?? "$";
    body.innerHTML = cartView.items.map((item) => `
        <div class="cart-item" data-key="${item.key}" data-catalog-type="${item.catalogType}" data-item-id="${item.itemId}">
            <img class="cart-item-img" src="${imgBasePath()}${item.imageUrl}" alt="${escapeHtml(item.name)}">
            <div class="cart-item-info">
                <p class="cart-item-name">${escapeHtml(item.name)}</p>
                <p class="cart-item-price">${symbol} ${item.price.toFixed(2)}</p>
                <div class="cart-item-qty">
                    <button type="button" class="cart-qty-btn cart-qty-decrease" aria-label="Disminuir cantidad" ${item.quantity <= 1 ? "disabled" : ""}>&minus;</button>
                    <span class="cart-qty-value">${item.quantity}</span>
                    <button type="button" class="cart-qty-btn cart-qty-increase" aria-label="Aumentar cantidad">&plus;</button>
                </div>
            </div>
            <button type="button" class="cart-remove-btn" aria-label="Eliminar del carrito">
                <svg class="cart-remove-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                </svg>
            </button>
        </div>
    `).join("");
    footer.innerHTML = `
        <div class="cart-panel-total">
            <span>Total</span>
            <span>${symbol} ${cartView.total.toFixed(2)}</span>
        </div>
        <button type="button" class="cart-checkout-btn" id="cart-checkout-btn">Proceder al Pago</button>
    `;
    document.getElementById("cart-checkout-btn")?.addEventListener("click", () => {
        if (!cartIsLoggedIn()) {
            closeCartPanel();
            openAuthModal();
            return;
        }
        window.location.href = checkoutUrl();
    });
}

function renderCartNav() {
    const container = document.getElementById("cart-nav");
    if (!container) {
        return;
    }
    container.innerHTML = `
        <div class="cart-wrap">
            <button type="button" id="cart-btn" class="cart-btn" aria-haspopup="true" aria-expanded="false" aria-label="Carrito de compras">
                <svg class="cart-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z"></path>
                </svg>
                <span id="cart-badge" class="cart-badge" hidden>0</span>
            </button>
            <div class="cart-panel" id="cart-panel" hidden>
                <div class="cart-panel-header">
                    <h3>Tu Carrito</h3>
                </div>
                <div class="cart-panel-body" id="cart-panel-body"></div>
                <div class="cart-panel-footer" id="cart-panel-footer"></div>
            </div>
        </div>
    `;

    document.getElementById("cart-btn").addEventListener("click", (event) => {
        event.stopPropagation();
        toggleCartPanel();
    });

    document.getElementById("cart-panel-body").addEventListener("click", async (event) => {
        const row = event.target.closest(".cart-item");
        if (!row) {
            return;
        }
        const key = row.dataset.key;
        const catalogType = row.dataset.catalogType;
        const itemId = Number(row.dataset.itemId);
        const currentQuantity = cartView.items.find((item) => item.key === key)?.quantity ?? 0;

        if (event.target.closest(".cart-qty-increase")) {
            await setCartItemQuantity(key, catalogType, itemId, currentQuantity + 1);
        } else if (event.target.closest(".cart-qty-decrease")) {
            if (currentQuantity <= 1) {
                return;
            }
            await setCartItemQuantity(key, catalogType, itemId, currentQuantity - 1);
        } else if (event.target.closest(".cart-remove-btn")) {
            await removeCartItem(key, catalogType, itemId);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderCartNav();
    refreshCart();

    document.addEventListener("click", (event) => {
        const panel = document.getElementById("cart-panel");
        const btn = document.getElementById("cart-btn");
        if (!panel || panel.hasAttribute("hidden")) {
            return;
        }
        if (!panel.contains(event.target) && event.target !== btn) {
            closeCartPanel();
        }
    });

    document.addEventListener("click", async (event) => {
        const addBtn = event.target.closest("[data-catalog-type][data-item-id]");
        if (!addBtn || !addBtn.matches(".bttnBolsa, .addCarrito")) {
            return;
        }
        const catalogType = addBtn.dataset.catalogType;
        const itemId = Number(addBtn.dataset.itemId);
        try {
            await addToCart(catalogType, itemId, 1);
            pulseAddButton(addBtn);
            bumpCartBadge();
        } catch (e) {
            console.error(e);
        }
    });
});

document.addEventListener("authchange", refreshCart);

document.addEventListener("currencychange", refreshCart);
