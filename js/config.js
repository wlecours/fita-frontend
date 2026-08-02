const CONFIG = {
    API_URL: "http://localhost:8080"
};

function inPagesDir() {
    return window.location.pathname.includes("/pages/");
}

function pagePath(fileName) {
    return inPagesDir() ? fileName : `pages/${fileName}`;
}

function rootAssetPath(path) {
    return inPagesDir() ? `../${path}` : path;
}