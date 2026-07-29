# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Fita is a static, multi-page marketing/e-commerce front end (Spanish-language, healthy food brand) built with plain HTML, SCSS, and vanilla JS. There is **no package.json and no build tool** (no npm, webpack, Vite, etc.) — JS files are loaded directly via `<script>` tags, no bundler or transpilation. The `.idea/` project files indicate this is developed in a JetBrains IDE, most likely relying on its built-in SCSS file watcher to compile Sass on save.

Per the Trello board ("Fita"), this site is growing from a catalog into a full ordering flow: guest-or-logged-in cart, a checkout page collecting delivery/pickup choice, manual payment details (Pago Móvil, Transferencia, PayPal, Binance, Zinli), and the day's exchange rate; customer accounts with signup and purchase history; and an admin view (item/stock CRUD, order management, exchange-rate control) reachable only via a separate, non-obvious URL rather than a nav link. Keep this trajectory in mind for structural decisions — e.g. the `currency.js` global-selector pattern (localStorage + `currencychange` CustomEvent) is the kind of cross-page mechanism the cart/login state will likely need too, given there's no shared JS module system to reach for instead.

## Build / compile

There are no npm scripts to run. To regenerate CSS after editing SCSS, compile `scss/style.scss` to `css/style.css` (with source map) using any Sass compiler, e.g.:

```
sass scss/style.scss css/style.css
```

Do not hand-edit `css/style.css` or `css/style.css.map` — they are compiled output and will be overwritten. Always make styling changes in the `scss/` partials.

There is no test runner, linter, or CI config in this repo.

## Architecture

**Pages** (all plain HTML, no templating engine — each page duplicates its own `<head>`, nav bar, and footer):
- `index.html` — homepage, at repo root
- `pages/menu.html`, `pages/productos.html`, `pages/nosotros.html`, `pages/ubicaciones.html` — secondary pages, one directory level down, so their asset links use `../` prefixes (`../css/style.css`, `../img/...`) while `index.html` uses unprefixed paths (`css/style.css`, `img/...`). Keep this in mind when copying markup between the root page and `pages/*.html`.

**Styles** (`scss/`): `style.scss` is the single entry point and just imports partials in a fixed cascade order — later partials override earlier ones:
```
_general → _elementos → _nav → _display → _texto → _reutilizables → _index → (style.scss's own rules) → _pages → _media
```
- `_general.scss` — CSS reset and the `:root` design tokens (CSS custom properties for colors, font sizes) plus `@font-face`.
- `_elementos.scss` — base element styling (headings, buttons, etc.).
- `_nav.scss` — nav bar, including the checkbox-hack mobile hamburger menu (see below).
- `_display.scss` — layout/flex/grid utility classes (`.flex`, `.vflex`, `.flxBetween`, `.flxAlgnCenter`, `.gap20`, `.padding80`, `.espacio30`/`.espacio60` spacers, etc.). These utilities are used extensively in the HTML instead of page-specific classes.
- `_texto.scss` — typography utility classes (`.fntFonarto`, `.fntAsap`, `.fntArima`, `.txtCenter`, `.txtDestaque`, `.txt22`/`.txt40`/`.txt96`, etc.).
- `_reutilizables.scss` — small reusable component styles (`.circulo`, `.hero`, `.banner`, `.grid-productos`, `.background-CTA`, `.check-ul`).
- `_index.scss` — styling specific to the homepage.
- `_pages.scss` — styling specific to the non-home pages.
- `_media.scss` — all responsive breakpoints, centralized in one file at the end of the cascade (not colocated with the component styles they adjust). Main breakpoints: `1024px` (general mobile layout), `1366px`/`768px`/`769–1023px` (product grid column counts on `productos.html`/`menu.html`).

Naming conventions English

**Interactivity without JS**: the mobile nav menu is a pure-CSS "checkbox hack" (`<input type="checkbox" id="checkbox_toggle">` + `<label class="hamburger">`, styled in `_nav.scss`). Button actions use inline `onclick="window.location.href='...'"` / `location.href='...'` navigation rather than JS event handlers or an `<a>` tag in some cases — follow this existing pattern for simple navigation actions.

**JS (`js/`)**: loaded via plain `<script>` tags, no shared module system (consistent with the no-build-tool setup) — files coordinate through globals (`CONFIG`, `getCurrency()`) and a `currencychange` `CustomEvent` on `document` rather than imports.
- `currency.js` — site-wide currency selector. Loaded on **every** page. Persists the chosen currency (`USD`/`VES`) to `localStorage` (`fita-currency` key, default `USD`), syncs the `#currency-select` `<select>` in each page's nav bar on load, and dispatches `currencychange` on `document` when the user changes it. Exposes `getCurrency()`/`setCurrency()` globally for other scripts.
- `config.js` — defines `CONFIG.API_URL`, the backend base URL (`http://localhost:8080`). Loaded before any page-specific script that calls the API.
- `productos.js` (used by `pages/productos.html`) / `menu.js` (used by `pages/menu.html`) — near-identical, independent scripts: each fetches a paginated page from the backend (`/api/products` / `/api/menu-items`, with `currency=${getCurrency()}`), renders cards into `#productos-grid` / `#menu-grid`, and renders prev/next pagination into `#productos-pagination` / `#menu-pagination`. Both re-fetch the current page on `currencychange` so switching currency in the nav updates prices immediately without a page reload.
- Only `menu.html` and `productos.html` load `config.js`/their own script; `currency.js` alone is enough for pages that just need the nav selector to persist a choice.

**Assets**: `img/` holds all images/icons (SVG for icons, JPG/PNG for photos), `fonts/` holds the self-hosted `Fonarto` font (`.ttf`, loaded via `@font-face` in `_general.scss`); Arima and Asap Condensed are loaded from Google Fonts in each page's `<head>`.

## Git remotes

- `origin` — `https://github.com/wlecours/fita-frontend.git` (this fork)
- `upstream` — `https://github.com/eugenisv/PFVillamizar.git` (original project this was forked from)

## Workflow preferences

- Do not start the dev server / stack or test frontend changes in a browser after every change, even when the change touches this repo from a `fita-backend` session. Only test in the browser when explicitly asked to test or verify it.