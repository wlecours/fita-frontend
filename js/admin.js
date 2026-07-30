const ADMIN_PAGE_SIZE = 50;

const CATALOGS = {
    products: {
        listPath: "/api/products",
        adminPath: "/api/admin/products",
        tableBodyId: "admin-products-body",
        formId: "admin-products-form"
    },
    "menu-items": {
        listPath: "/api/menu-items",
        adminPath: "/api/admin/menu-items",
        tableBodyId: "admin-menu-items-body",
        formId: "admin-menu-items-form"
    }
};

function isAdmin() {
    return getAuth()?.account?.role === "ADMIN";
}

function authHeaders() {
    const token = getAuth()?.token;
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

async function fetchAllItems(listPath) {
    let page = 0;
    let items = [];
    while (true) {
        const response = await fetch(`${CONFIG.API_URL}${listPath}?page=${page}&size=${ADMIN_PAGE_SIZE}&currency=USD`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${listPath}: ${response.status}`);
        }
        const data = await response.json();
        items = items.concat(data.content);
        if (page >= data.totalPages - 1) {
            break;
        }
        page++;
    }
    return items;
}

function renderRow(kind, item) {
    return `
        <tr data-id="${item.id}">
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.description ?? "")}</td>
            <td>$${item.price}</td>
            <td>${escapeHtml(item.imageUrl ?? "")}</td>
            <td class="admin-row-actions">
                <button type="button" class="admin-edit-btn" data-kind="${kind}" data-id="${item.id}">Editar</button>
                <button type="button" class="admin-delete-btn" data-kind="${kind}" data-id="${item.id}">Eliminar</button>
            </td>
        </tr>
    `;
}

async function loadCatalog(kind) {
    const { listPath, tableBodyId } = CATALOGS[kind];
    const tbody = document.getElementById(tableBodyId);
    const items = await fetchAllItems(listPath);
    tbody.innerHTML = items.map(item => renderRow(kind, item)).join("");
}

function getForm(kind) {
    return document.getElementById(CATALOGS[kind].formId);
}

function resetForm(kind) {
    const form = getForm(kind);
    form.reset();
    form.elements.id.value = "";
    form.querySelector(".admin-form-error").textContent = "";
    form.querySelector(".admin-cancel-btn").hidden = true;
    form.querySelector(".admin-submit-btn").textContent = kind === "products" ? "Agregar Producto" : "Agregar Ítem";
}

function fillFormForEdit(kind, item) {
    const form = getForm(kind);
    form.elements.id.value = item.id;
    form.elements.name.value = item.name;
    form.elements.description.value = item.description ?? "";
    form.elements.price.value = item.price;
    form.elements.imageUrl.value = item.imageUrl ?? "";
    form.querySelector(".admin-cancel-btn").hidden = false;
    form.querySelector(".admin-submit-btn").textContent = "Guardar Cambios";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleFormSubmit(kind, event) {
    event.preventDefault();
    const form = getForm(kind);
    const errorEl = form.querySelector(".admin-form-error");
    errorEl.textContent = "";

    const id = form.elements.id.value;
    const payload = {
        name: form.elements.name.value,
        description: form.elements.description.value || null,
        price: Number(form.elements.price.value),
        imageUrl: form.elements.imageUrl.value || null
    };

    const { adminPath } = CATALOGS[kind];
    const url = id ? `${CONFIG.API_URL}${adminPath}/${id}` : `${CONFIG.API_URL}${adminPath}`;
    const method = id ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            errorEl.textContent = data.message || "Ocurrió un error, intenta de nuevo";
            return;
        }
        resetForm(kind);
        await loadCatalog(kind);
    } catch (e) {
        errorEl.textContent = "No se pudo conectar con el servidor";
    }
}

async function handleDelete(kind, id) {
    if (!confirm("¿Eliminar este elemento?")) {
        return;
    }
    const { adminPath } = CATALOGS[kind];
    try {
        const response = await fetch(`${CONFIG.API_URL}${adminPath}/${id}`, {
            method: "DELETE",
            headers: authHeaders()
        });
        if (!response.ok && response.status !== 204) {
            throw new Error(`Failed to delete: ${response.status}`);
        }
        await loadCatalog(kind);
    } catch (e) {
        alert("No se pudo eliminar el elemento");
    }
}

function wireCatalog(kind) {
    const form = getForm(kind);
    form.addEventListener("submit", (event) => handleFormSubmit(kind, event));
    form.querySelector(".admin-cancel-btn").addEventListener("click", () => resetForm(kind));

    document.getElementById(CATALOGS[kind].tableBodyId).addEventListener("click", async (event) => {
        const editBtn = event.target.closest(".admin-edit-btn");
        const deleteBtn = event.target.closest(".admin-delete-btn");
        if (editBtn) {
            const items = await fetchAllItems(CATALOGS[kind].listPath);
            const item = items.find(i => String(i.id) === editBtn.dataset.id);
            if (item) {
                fillFormForEdit(kind, item);
            }
        } else if (deleteBtn) {
            handleDelete(kind, deleteBtn.dataset.id);
        }
    });
}

async function renderAdminGate() {
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
    if (content.dataset.loaded === "true") {
        return;
    }
    content.dataset.loaded = "true";
    try {
        await Promise.all([loadCatalog("products"), loadCatalog("menu-items")]);
    } catch (e) {
        console.error(e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    wireCatalog("products");
    wireCatalog("menu-items");
    renderAdminGate();
});

document.addEventListener("authchange", renderAdminGate);
