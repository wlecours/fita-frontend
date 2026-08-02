let checkoutCart = { items: [], total: 0, currency: "USD" };
let checkoutExchangeRate = 0;

function checkoutCurrencySymbol(currency) {
    return currency === "VES" ? "Bs." : "$";
}

async function fetchExchangeRate() {
    const response = await fetch(`${CONFIG.API_URL}/api/exchange-rate`);
    const data = await response.json();
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
    const symbol = checkoutCurrencySymbol(checkoutCart.currency);
    document.getElementById("checkout-summary-items").innerHTML = checkoutCart.items.map((item) => `
        <div class="checkout-summary-item">
            <span>${escapeHtml(item.name)} &times;${item.quantity}</span>
            <span>${symbol} ${item.lineTotal.toFixed(2)}</span>
        </div>
    `).join("");
    document.getElementById("checkout-summary-total").textContent = `${symbol} ${checkoutCart.total.toFixed(2)}`;
    const isVes = checkoutCart.currency === "VES";
    const secondaryTotal = isVes ? checkoutCart.total / checkoutExchangeRate : checkoutCart.total * checkoutExchangeRate;
    document.getElementById("checkout-summary-secondary-label").textContent = isVes ? "Total en USD" : "Total en Bs.";
    document.getElementById("checkout-summary-total-ves").textContent = `${isVes ? "$" : "Bs."} ${secondaryTotal.toFixed(2)}`;
    document.getElementById("checkout-exchange-rate").textContent = `Tasa del día: 1 USD = Bs. ${checkoutExchangeRate.toFixed(2)}`;
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
    const symbol = checkoutCurrencySymbol(order.currency);
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
        const response = await fetch(`${CONFIG.API_URL}/api/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuth().token}`
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            errorEl.textContent = data.message || "Ocurrió un error, verifica los datos e intenta de nuevo";
            return;
        }
        await refreshCart();
        renderConfirmation(data);
        showCheckoutState("confirmation");
    } catch (e) {
        errorEl.textContent = "No se pudo conectar con el servidor";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initCheckoutPage();

    document.getElementById("checkout-gate-login-btn")?.addEventListener("click", openAuthModal);

    document.querySelectorAll('input[name="deliveryMethod"]').forEach((radio) =>
        radio.addEventListener("change", toggleDeliveryFields)
    );

    document.getElementById("checkout-form")?.addEventListener("submit", submitCheckout);
});

document.addEventListener("authchange", initCheckoutPage);

document.addEventListener("currencychange", initCheckoutPage);
