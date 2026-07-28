const PAGE_SIZE = 12;
const CURRENCY_SYMBOLS = { USD: "$", VES: "Bs." };

let currentPage = 0;
let currentCurrency = "USD";

function renderProduct(product) {
    const symbol = CURRENCY_SYMBOLS[product.currency] ?? "$";
    return `
        <div>
            <div class="producto flex vflex gap8 centerDiv">
                <div class="flex flxCenter producto-img"><img src="../img/${product.imageUrl}" width="141px" height="161px"></div>
                <div class="producto-content flex vflex gap8">
                    <h2 class="txtSubtitulo">${product.name}</h2>
                    <p>${product.description}</p>
                    <div class="flex flxBetween flxBetween">
                        <p class="subtitulo">${symbol} ${product.price}</p>
                        <button class="bttnBolsa"><img src="../img/iconBag.svg" height="18px" width="18px" alt="Añadir a la Bolsa"></button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderProducts(products) {
    const grid = document.getElementById("productos-grid");
    grid.innerHTML = products.map(renderProduct).join("");
}

function renderPagination(totalPages) {
    const pagination = document.getElementById("productos-pagination");
    const prevDisabled = currentPage === 0 ? "disabled" : "";
    const nextDisabled = currentPage >= totalPages - 1 ? "disabled" : "";
    pagination.innerHTML = `
        <button id="prev-page" ${prevDisabled}>Anterior</button>
        <span>Página ${currentPage + 1} de ${Math.max(totalPages, 1)}</span>
        <button id="next-page" ${nextDisabled}>Siguiente</button>
    `;
    document.getElementById("prev-page").addEventListener("click", () => goToPage(currentPage - 1));
    document.getElementById("next-page").addEventListener("click", () => goToPage(currentPage + 1));
}

function renderCurrencyToggle() {
    document.getElementById("currency-usd").classList.toggle("active", currentCurrency === "USD");
    document.getElementById("currency-ves").classList.toggle("active", currentCurrency === "VES");
}

function setCurrency(currency) {
    if (currency === currentCurrency) {
        return;
    }
    currentCurrency = currency;
    renderCurrencyToggle();
    goToPage(currentPage);
}

async function loadProducts(page) {
    const response = await fetch(`${CONFIG.API_URL}/api/products?page=${page}&size=${PAGE_SIZE}&currency=${currentCurrency}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
    }
    return response.json();
}

async function goToPage(page) {
    if (page < 0) {
        return;
    }
    try {
        const data = await loadProducts(page);
        currentPage = data.page;
        renderProducts(data.content);
        renderPagination(data.totalPages);
    } catch (error) {
        console.error(error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("currency-usd").addEventListener("click", () => setCurrency("USD"));
    document.getElementById("currency-ves").addEventListener("click", () => setCurrency("VES"));
    renderCurrencyToggle();
    goToPage(0);
});
