const PAGE_SIZE = 12;

let currentPage = 0;

function renderMenuItem(menuItem) {
    const symbol = currencySymbol(menuItem.currency);
    return `
        <div>
            <div class="carousel-item centerDiv">
                <img src="../img/${menuItem.imageUrl}" height="188px" width="267px">
                <div class="carousel-content">
                    <h3>${menuItem.name}</h3>
                    <p class="txtSubtitulo">${symbol} ${menuItem.price}</p>
                    <p>${menuItem.description}</p>
                    <button class="addCarrito" data-catalog-type="MENU" data-item-id="${menuItem.id}"><img src="../img/iconBag.svg"> Agregar al carrito</button>
                </div>
            </div>
        </div>
    `;
}

function renderMenuItems(menuItems) {
    const grid = document.getElementById("menu-grid");
    grid.innerHTML = menuItems.map(renderMenuItem).join("");
}

function renderPagination(totalPages) {
    const pagination = document.getElementById("menu-pagination");
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

async function loadMenuItems(page) {
    const response = await fetch(`${CONFIG.API_URL}/api/menu-items?page=${page}&size=${PAGE_SIZE}&currency=${getCurrency()}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch menu items: ${response.status}`);
    }
    return response.json();
}

async function goToPage(page) {
    if (page < 0) {
        return;
    }
    try {
        const data = await loadMenuItems(page);
        currentPage = data.page;
        renderMenuItems(data.content);
        renderPagination(data.totalPages);
    } catch (error) {
        console.error(error);
    }
}

document.addEventListener("DOMContentLoaded", () => goToPage(0));
document.addEventListener("currencychange", () => goToPage(currentPage));
