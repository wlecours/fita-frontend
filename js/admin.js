const CATALOGS = {
    products: {
        listPath: "/api/products",
        adminPath: "/api/admin/products",
        tableBodyId: "admin-products-body",
        paginationId: "admin-products-pagination",
        loaded: false,
        page: 0,
        pageSize: 10
    },
    "menu-items": {
        listPath: "/api/menu-items",
        adminPath: "/api/admin/menu-items",
        tableBodyId: "admin-menu-items-body",
        paginationId: "admin-menu-items-pagination",
        loaded: false,
        page: 0,
        pageSize: 10
    }
};

const ICON_EDIT = `<svg class="admin-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>`;
const ICON_DELETE = `<svg class="admin-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>`;
const ICON_SAVE = `<svg class="admin-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.41 1.41L9 19 21 7l-1.41-1.41z"></path></svg>`;
const ICON_CANCEL = `<svg class="admin-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>`;
const ICON_CHEVRON_LEFT = `<svg class="admin-chevron" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg>`;
const ICON_CHEVRON_RIGHT = `<svg class="admin-chevron" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"></path></svg>`;

function isAdmin() {
    return getAuth()?.account?.role === "ADMIN";
}

function authHeaders() {
    const token = getAuth()?.token;
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

function renderRow(kind, item) {
    return `
        <tr data-id="${item.id}">
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.description ?? "")}</td>
            <td>$${item.price}</td>
            <td>${escapeHtml(item.imageUrl ?? "")}</td>
            <td class="admin-row-actions">
                <button type="button" class="admin-icon-btn admin-edit-btn" data-kind="${kind}" data-item="${encodeURIComponent(JSON.stringify(item))}" aria-label="Editar">${ICON_EDIT}</button>
                <button type="button" class="admin-icon-btn admin-delete-btn" data-kind="${kind}" data-id="${item.id}" aria-label="Eliminar">${ICON_DELETE}</button>
            </td>
        </tr>
    `;
}

function renderEditRow(kind, item) {
    return `
        <tr data-id="${item.id}" class="admin-row-editing">
            <td><input type="text" class="admin-inline-input" name="name" value="${escapeHtml(item.name)}"></td>
            <td><input type="text" class="admin-inline-input" name="description" value="${escapeHtml(item.description ?? "")}"></td>
            <td><input type="number" class="admin-inline-input admin-inline-price" name="price" min="0" step="0.01" value="${item.price}"></td>
            <td><input type="text" class="admin-inline-input" name="imageUrl" value="${escapeHtml(item.imageUrl ?? "")}"></td>
            <td class="admin-row-actions">
                <button type="button" class="admin-icon-btn admin-save-btn" data-kind="${kind}" aria-label="Guardar">${ICON_SAVE}</button>
                <button type="button" class="admin-icon-btn admin-cancel-edit-btn" data-kind="${kind}" data-item="${encodeURIComponent(JSON.stringify(item))}" aria-label="Cancelar">${ICON_CANCEL}</button>
            </td>
        </tr>
    `;
}

function renderNewRow(kind) {
    return `
        <tr class="admin-row-editing admin-row-new">
            <td><input type="text" class="admin-inline-input" name="name" placeholder="Nombre"></td>
            <td><input type="text" class="admin-inline-input" name="description" placeholder="Descripción"></td>
            <td><input type="number" class="admin-inline-input admin-inline-price" name="price" min="0" step="0.01" placeholder="0.00"></td>
            <td><input type="text" class="admin-inline-input" name="imageUrl" placeholder="ejemplo.jpg"></td>
            <td class="admin-row-actions">
                <button type="button" class="admin-icon-btn admin-save-btn" data-kind="${kind}" aria-label="Guardar">${ICON_SAVE}</button>
                <button type="button" class="admin-icon-btn admin-cancel-edit-btn" data-kind="${kind}" aria-label="Cancelar">${ICON_CANCEL}</button>
            </td>
        </tr>
    `;
}

function pageNumbersToShow(current, total) {
    const pages = new Set([0, total - 1, current - 1, current, current + 1]);
    return [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
}

function renderCatalogPagination(kind, page, totalPages) {
    const catalog = CATALOGS[kind];
    const container = document.getElementById(catalog.paginationId);
    if (!container) {
        return;
    }

    let numbersHtml = "";
    let previous = -1;
    for (const p of pageNumbersToShow(page, totalPages)) {
        if (previous !== -1 && p - previous > 1) {
            numbersHtml += `<span class="admin-page-ellipsis">…</span>`;
        }
        numbersHtml += `<button type="button" class="admin-page-num ${p === page ? "active" : ""}" data-page="${p}">${p + 1}</button>`;
        previous = p;
    }

    container.innerHTML = `
        <div class="admin-pagination-nav">
            <button type="button" class="admin-page-prev" ${page === 0 ? "disabled" : ""}>${ICON_CHEVRON_LEFT}Prev</button>
            ${numbersHtml}
            <button type="button" class="admin-page-next" ${page >= totalPages - 1 ? "disabled" : ""}>Next${ICON_CHEVRON_RIGHT}</button>
        </div>
        <div class="admin-pagination-size">
            <select class="admin-page-size-select" aria-label="Elementos por página">
                <option value="10" ${catalog.pageSize === 10 ? "selected" : ""}>10 / page</option>
                <option value="20" ${catalog.pageSize === 20 ? "selected" : ""}>20 / page</option>
                <option value="50" ${catalog.pageSize === 50 ? "selected" : ""}>50 / page</option>
            </select>
        </div>
    `;

    container.querySelector(".admin-page-prev").addEventListener("click", () => loadCatalogPage(kind, page - 1).catch((e) => console.error(e)));
    container.querySelector(".admin-page-next").addEventListener("click", () => loadCatalogPage(kind, page + 1).catch((e) => console.error(e)));
    container.querySelectorAll(".admin-page-num").forEach((btn) => {
        btn.addEventListener("click", () => loadCatalogPage(kind, Number(btn.dataset.page)).catch((e) => console.error(e)));
    });
    container.querySelector(".admin-page-size-select").addEventListener("change", (event) => {
        catalog.pageSize = Number(event.target.value);
        loadCatalogPage(kind, 0).catch((e) => console.error(e));
    });
}

async function loadCatalogPage(kind, page) {
    if (page < 0) {
        return;
    }
    const catalog = CATALOGS[kind];
    const response = await fetch(`${CONFIG.API_URL}${catalog.listPath}?page=${page}&size=${catalog.pageSize}&currency=USD`);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${catalog.listPath}: ${response.status}`);
    }
    const data = await response.json();
    catalog.page = data.page;
    catalog.loaded = true;
    document.getElementById(catalog.tableBodyId).innerHTML = data.content.map((item) => renderRow(kind, item)).join("");
    renderCatalogPagination(kind, data.page, data.totalPages);
}

function loadCatalogIfNeeded(kind) {
    const catalog = CATALOGS[kind];
    if (!catalog || catalog.loaded) {
        return Promise.resolve();
    }
    return loadCatalogPage(kind, 0);
}

async function handleDelete(kind, id) {
    if (!confirm("¿Eliminar este elemento?")) {
        return;
    }
    try {
        const response = await fetch(`${CONFIG.API_URL}${CATALOGS[kind].adminPath}/${id}`, {
            method: "DELETE",
            headers: authHeaders()
        });
        if (!response.ok && response.status !== 204) {
            throw new Error(`Failed to delete: ${response.status}`);
        }
        await loadCatalogPage(kind, CATALOGS[kind].page);
    } catch (e) {
        alert("No se pudo eliminar el elemento");
    }
}

async function handleInlineSave(kind, row) {
    const id = row.dataset.id;
    const payload = {
        name: row.querySelector('input[name="name"]').value,
        description: row.querySelector('input[name="description"]').value || null,
        price: Number(row.querySelector('input[name="price"]').value),
        imageUrl: row.querySelector('input[name="imageUrl"]').value || null
    };

    try {
        const response = await fetch(`${CONFIG.API_URL}${CATALOGS[kind].adminPath}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            alert(data.message || "Ocurrió un error, intenta de nuevo");
            return;
        }
        const updated = await response.json();
        row.outerHTML = renderRow(kind, updated);
    } catch (e) {
        alert("No se pudo conectar con el servidor");
    }
}

function catalogErrorEl(kind) {
    return document.getElementById(`admin-${kind}-error`);
}

async function handleInlineCreate(kind, row) {
    const errorEl = catalogErrorEl(kind);
    if (errorEl) {
        errorEl.textContent = "";
    }
    const payload = {
        name: row.querySelector('input[name="name"]').value,
        description: row.querySelector('input[name="description"]').value || null,
        price: Number(row.querySelector('input[name="price"]').value),
        imageUrl: row.querySelector('input[name="imageUrl"]').value || null
    };

    try {
        const response = await fetch(`${CONFIG.API_URL}${CATALOGS[kind].adminPath}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            if (errorEl) {
                errorEl.textContent = data.message || "Ocurrió un error, intenta de nuevo";
            }
            return;
        }
        await loadCatalogPage(kind, 0);
    } catch (e) {
        if (errorEl) {
            errorEl.textContent = "No se pudo conectar con el servidor";
        }
    }
}

function wireCatalog(kind) {
    document.getElementById(CATALOGS[kind].tableBodyId).addEventListener("click", (event) => {
        const editBtn = event.target.closest(".admin-edit-btn");
        const deleteBtn = event.target.closest(".admin-delete-btn");
        const saveBtn = event.target.closest(".admin-save-btn");
        const cancelBtn = event.target.closest(".admin-cancel-edit-btn");

        if (editBtn) {
            const item = JSON.parse(decodeURIComponent(editBtn.dataset.item));
            editBtn.closest("tr").outerHTML = renderEditRow(kind, item);
        } else if (cancelBtn) {
            const row = cancelBtn.closest("tr");
            if (row.classList.contains("admin-row-new")) {
                row.remove();
            } else {
                const item = JSON.parse(decodeURIComponent(cancelBtn.dataset.item));
                row.outerHTML = renderRow(kind, item);
            }
        } else if (deleteBtn) {
            handleDelete(kind, deleteBtn.dataset.id);
        } else if (saveBtn) {
            const row = saveBtn.closest("tr");
            if (row.classList.contains("admin-row-new")) {
                handleInlineCreate(kind, row);
            } else {
                handleInlineSave(kind, row);
            }
        }
    });
}

function activeTab() {
    return document.querySelector(".admin-tab-btn.active")?.dataset.tab ?? "products";
}

function switchTab(tab) {
    document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
        const active = btn.dataset.tab === tab;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll(".admin-tab-panel").forEach((panel) => {
        panel.hidden = panel.dataset.tabPanel !== tab;
    });
    loadCatalogIfNeeded(tab).catch((e) => console.error(e));
}

function renderAdminGate() {
    const gate = document.getElementById("admin-gate");
    const content = document.getElementById("admin-content");
    if (!gate || !content) {
        return;
    }
    if (!isAdmin()) {
        gate.hidden = false;
        content.hidden = true;
        return;
    }
    gate.hidden = true;
    content.hidden = false;
    loadCatalogIfNeeded(activeTab()).catch((e) => console.error(e));
}

document.addEventListener("DOMContentLoaded", () => {
    wireCatalog("products");
    wireCatalog("menu-items");
    document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
    document.querySelectorAll(".admin-add-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const kind = btn.dataset.kind;
            const tbody = document.getElementById(CATALOGS[kind].tableBodyId);
            if (tbody.querySelector(".admin-row-new")) {
                return;
            }
            tbody.insertAdjacentHTML("afterbegin", renderNewRow(kind));
            tbody.querySelector(".admin-row-new input[name='name']").focus();
        });
    });
    renderAdminGate();
});

document.addEventListener("authchange", renderAdminGate);
