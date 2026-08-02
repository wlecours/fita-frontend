let checkoutCart = { items: [], total: 0, currency: "USD" };
let checkoutExchangeRate = 0;

async function fetchExchangeRate() {
    const data = await apiRequest("/api/exchange-rate");
    return Number(data.usdToVes);
}

function showCheckoutState(state) {
    const stateIds = { gate: "checkout-gate", empty: "checkout-empty", form: "checkout-content", confirmation: "checkout-confirmation" };
    Object.values(stateIds).forEach((id) => document.getElementById(id).hidden = true);
    document.getElementById(stateIds[state]).hidden = false;
}

function toggleDeliveryFields() {
    const method = document.querySelector('input[name="deliveryMethod"]:checked')?.value;
    document.getElementById("checkout-field-address").hidden = method !== "DELIVERY";
    document.getElementById("checkout-field-pickup").hidden = method !== "PICKUP";
}

function prefillFromAccount() {
    const auth = getAuth();
    if (!auth) {
        return;
    }
    const form = document.getElementById("checkout-form");
    form.customerName.value = auth.account.name || "";
    form.phone.value = auth.account.phone || "";
    form.email.value = auth.account.email || "";
    if (auth.account.address) {
        form.deliveryAddress.value = auth.account.address;
    }
}

function renderOrderSummary() {
    const symbol = currencySymbol(checkoutCart.currency);
    document.getElementById("checkout-summary-items").innerHTML = checkoutCart.items.map((item) => `
        <div class="checkout-summary-item" data-key="${item.key}" data-catalog-type="${item.catalogType}" data-item-id="${item.itemId}">
            <div class="checkout-summary-item-info">
                <span class="checkout-summary-item-name">${escapeHtml(item.name)}</span>
                <div class="checkout-summary-item-qty">
                    <button type="button" class="checkout-qty-btn checkout-qty-decrease" aria-label="Disminuir cantidad" ${item.quantity <= 1 ? "disabled" : ""}>&minus;</button>
                    <span class="checkout-qty-value">${item.quantity}</span>
                    <button type="button" class="checkout-qty-btn checkout-qty-increase" aria-label="Aumentar cantidad">&plus;</button>
                </div>
            </div>
            <div class="checkout-summary-item-right">
                <span class="checkout-summary-item-price">${symbol} ${item.lineTotal.toFixed(2)}</span>
                <button type="button" class="checkout-summary-remove-btn" aria-label="Eliminar del pedido">
                    <svg class="checkout-summary-remove-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join("");
    document.getElementById("checkout-summary-total").textContent = `${symbol} ${checkoutCart.total.toFixed(2)}`;
    const isVes = checkoutCart.currency === "VES";
    const secondaryTotal = isVes ? checkoutCart.total / checkoutExchangeRate : checkoutCart.total * checkoutExchangeRate;
    document.getElementById("checkout-summary-secondary-label").textContent = isVes ? "Total en USD" : "Total en Bs.";
    document.getElementById("checkout-summary-total-ves").textContent = `${isVes ? "$" : "Bs."} ${secondaryTotal.toFixed(2)}`;
    document.getElementById("checkout-exchange-rate").textContent = `Tasa del día: 1 USD = Bs. ${checkoutExchangeRate.toFixed(2)}`;
}

async function refreshCheckoutCart() {
    try {
        checkoutCart = await buildAccountCartView(getCurrency());
    } catch (e) {
        console.error(e);
        return;
    }
    if (checkoutCart.items.length === 0) {
        showCheckoutState("empty");
        return;
    }
    renderOrderSummary();
}

async function initCheckoutPage() {
    if (!cartIsLoggedIn()) {
        showCheckoutState("gate");
        return;
    }
    try {
        const currency = getCurrency();
        [checkoutCart, checkoutExchangeRate] = await Promise.all([
            buildAccountCartView(currency),
            fetchExchangeRate()
        ]);
    } catch (e) {
        console.error(e);
        showCheckoutState("empty");
        return;
    }
    if (checkoutCart.items.length === 0) {
        showCheckoutState("empty");
        return;
    }
    showCheckoutState("form");
    prefillFromAccount();
    toggleDeliveryFields();
    renderOrderSummary();
}

function renderConfirmation(order) {
    const symbol = currencySymbol(order.currency);
    const isVes = order.currency === "VES";
    const secondaryLabel = isVes ? "Total en USD" : "Total en Bs.";
    const secondaryTotal = isVes ? order.totalUsd : order.totalVes;
    const deliveryLine = order.deliveryMethod === "DELIVERY"
        ? `Entrega a: ${escapeHtml(order.deliveryAddress)}`
        : `Retiro en: ${escapeHtml(order.pickupPoint)}`;
    document.getElementById("checkout-confirmation-body").innerHTML = `
        <p class="checkout-confirmation-number">¡Pedido recibido! N.º ${order.id}</p>
        <p>Tu pedido está pendiente de confirmación de pago.</p>
        <p>${deliveryLine}</p>
        <div class="checkout-summary-total-row">
            <span>Total</span>
            <span>${symbol} ${order.totalInCurrency.toFixed(2)}</span>
        </div>
        <div class="checkout-summary-total-row checkout-summary-total-row-secondary">
            <span>${secondaryLabel}</span>
            <span>${isVes ? "$" : "Bs."} ${secondaryTotal.toFixed(2)}</span>
        </div>
    `;
}

async function submitCheckout(event) {
    event.preventDefault();
    const form = event.target;
    const errorEl = document.getElementById("checkout-error");
    errorEl.textContent = "";
    const deliveryMethod = form.deliveryMethod.value;
    const payload = {
        customerName: form.customerName.value,
        phone: form.phone.value,
        email: form.email.value,
        fiscalId: form.fiscalId.value,
        deliveryMethod,
        deliveryAddress: deliveryMethod === "DELIVERY" ? form.deliveryAddress.value : null,
        pickupPoint: deliveryMethod === "PICKUP" ? form.pickupPoint.value : null,
        paymentMethod: form.paymentMethod.value,
        paymentSenderInfo: form.paymentSenderInfo.value,
        paymentReference: form.paymentReference.value,
        currency: checkoutCart.currency
    };
    try {
        const data = await apiRequest("/api/orders", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        await refreshCart();
        renderConfirmation(data);
        showCheckoutState("confirmation");
    } catch (e) {
        errorEl.textContent = e.message;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initCheckoutPage();

    document.getElementById("checkout-gate-login-btn")?.addEventListener("click", openAuthModal);

    document.querySelectorAll('input[name="deliveryMethod"]').forEach((radio) =>
        radio.addEventListener("change", toggleDeliveryFields)
    );

    document.getElementById("checkout-form")?.addEventListener("submit", submitCheckout);

    document.getElementById("checkout-summary-items").addEventListener("click", async (event) => {
        const row = event.target.closest(".checkout-summary-item");
        if (!row) {
            return;
        }
        const key = row.dataset.key;
        const catalogType = row.dataset.catalogType;
        const itemId = Number(row.dataset.itemId);
        const currentQuantity = checkoutCart.items.find((item) => item.key === key)?.quantity ?? 0;

        if (event.target.closest(".checkout-qty-increase")) {
            await setCartItemQuantity(key, catalogType, itemId, currentQuantity + 1);
            await refreshCheckoutCart();
        } else if (event.target.closest(".checkout-qty-decrease")) {
            if (currentQuantity <= 1) {
                return;
            }
            await setCartItemQuantity(key, catalogType, itemId, currentQuantity - 1);
            await refreshCheckoutCart();
        } else if (event.target.closest(".checkout-summary-remove-btn")) {
            await removeCartItem(key, catalogType, itemId);
            await refreshCheckoutCart();
        }
    });
});

document.addEventListener("authchange", initCheckoutPage);

document.addEventListener("currencychange", initCheckoutPage);
