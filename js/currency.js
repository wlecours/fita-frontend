const CURRENCY_STORAGE_KEY = "fita-currency";
const DEFAULT_CURRENCY = "USD";
const CURRENCY_SYMBOLS = { USD: "$", VES: "Bs." };

function currencySymbol(currency) {
    return CURRENCY_SYMBOLS[currency] ?? "$";
}

function getCurrency() {
    return localStorage.getItem(CURRENCY_STORAGE_KEY) || DEFAULT_CURRENCY;
}

function setCurrency(currency) {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    document.dispatchEvent(new CustomEvent("currencychange", { detail: { currency } }));
}

document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("currency-select");
    if (!select) {
        return;
    }
    select.value = getCurrency();
    select.addEventListener("change", () => setCurrency(select.value));
});
