# PRD — Raziel Ledger

## 1. Overview

**Raziel Ledger** is a rewrite of the [GranblueParty](https://github.com/Minimalist3/GranblueParty) project, reduced to its two long-term material-planning calculators for Granblue Fantasy:

- **Eternals Calculator** (`/calceternal`) — materials needed to recruit, uncap (5★), and transcend (6★) an Eternal, using the "40 boxes" method.
- **Evokers Calculator** (`/calcevoker`) — materials needed to obtain an Arcarum summon, recruit its Evoker, and uncap the Evoker and the New World Foundation weapon.

The original project is a Vue 2 SSR application (webpack + Express) backed by a PostgreSQL API with user accounts. This rewrite removes the server and account system entirely: the two calculators are fully client-side and persist their state in `localStorage`, so they can be served as a static SPA from GitHub Pages.

## 2. Goals

| # | Goal |
|---|------|
| G1 | Migrate the frontend stack from Vue 2 / Vuex / webpack SSR to **Vue 3 + Vite**, deployed as a static **SPA on GitHub Pages**. |
| G2 | Serve **only** the two calculator routes `/calceternal` and `/calcevoker`, plus a minimal homepage at `/` that lets the user choose between them, and a 404 fallback. |
| G3 | **Remove the API** — no backend, no axios, no accounts, no authentication of any kind. |
| G4 | **WikiParser is the standalone item-image fetcher** (`WikiParser/update_img.py` + `data/supplies.images`): it downloads the calculators' item icons into `public/img/item/` from a hand-authored manifest. Reduced from the upstream wiki-scrape/Postgres pipeline in v1.2.5 (PRD/v1.2.md §10); remains GPL-3.0. |
| G5 | Keep feature parity for the two calculators: unit selection, completed/target step ranges, split/merged materials, hide-completed filter, grid/list display, per-item quantity tracking, and `localStorage` persistence. |

## 3. Non-goals

- Party Builder, Collection Tracker, Daily Grind, Spark, Teams, Search, Replicard, Friend Summons, Release Schedule, Room Name, and the other calculators (Bullets, GW, Dread, Event) are **not** ported.
- No user accounts, login, signup, or JWT handling (G3).
- No ads, analytics, or consent management.
- No server-side rendering. Since v1.2.6 (PRD/v1.2.md §11) the social-preview/SEO meta tags (title, description, canonical, Open Graph, Twitter Card) are **static** in `index.html` so non-JS scrapers can read them; v1.2.8 (§12) added a runtime per-route `afterEach` hook, and v1.2.9 (§13) added build-time pre-rendered per-route HTML (`dist/calceternal`, `dist/calcevoker`) so scrapers get per-page cards — all without SSR.
- No translation/JP-names toggle (the dropped pages were the main consumers; calculator data is English).

## 4. Users

Granblue Fantasy players tracking multi-month grinds for Eternals/Evokers. They visit periodically, update material counts, and rely on their progress being remembered between visits **on the same browser** (localStorage; no cross-device sync, which is acceptable without accounts).

## 5. Functional requirements

### 5.1 Routing (SPA)
- `/` → homepage with two prominent entries ("Eternals Calculator" / "Evokers Calculator") linking to the calculator routes.
- `/calceternal` → Eternals calculator.
- `/calcevoker` → Evokers calculator.
- Any other path → 404 page with a link back home.
- HTML5 history mode. Since v1.2.6 (PRD/v1.2.md §11) GitHub Pages serves a dedicated rafgraph `404.html` redirect that bounces unknown paths to `…/?/<path>` (a 200 home document), which `index.html` rewrites back to the real path before the router boots — so deep links resolve to the SPA router on a 200 document. (Pre-1.2.6 this was a verbatim copy of `index.html`.)
- The app is hosted at `https://<user>.github.io/raziel-ledger/`, so the Vite/router base is `/raziel-ledger/`.

### 5.2 Calculator behavior (parity with original)
- Add any of the 10 Eternals / 10 Evokers; each appears as a foldable progress box; remove at will.
- Per unit: select "Completed step" and "Target step"; only materials in that range are shown. Selecting a completed step ≥ target step pushes the target forward.
- Toggle **Split materials for each step** (per-step lists vs. one merged list with summed quantities).
- Toggle **Hide completed materials**.
- Display switch: **Grid** (item cards with images) or **List** (compact rows).
- Each material shows an image, a link to its gbf.wiki page, an editable quantity (arrow-key increment/decrement, capped at max), and a one-click "complete" check.
- Group items (e.g. element-dependent orbs, summon-specific astras) resolve to concrete items based on the unit's element/id, with quantities divided across resolved items exactly as in the original.
- All progress and UI toggles persist to `localStorage` under the same keys as the original (`CalcEternal-*`, `CalcEvoker-*`, `App-*`) so existing users' data survives the migration when served from the same origin (best effort; different origin = fresh state).

### 5.3 App shell
- Slim navbar: links to home and the two calculators, theme switcher (dark / blue / light, persisted), JST clock.
- Footer: attribution to the original GranblueParty project (GPL-3.0) and the Cygames trademark notice.
- No login/signup buttons, no ads slots, no cookie/privacy pages.

## 6. Technical requirements

| Area | Decision |
|------|----------|
| Build | Vite 7, `@vitejs/plugin-vue`, ESM, no TypeScript (source is plain JS). |
| Framework | Vue 3 (Options API kept — minimal diff against the original components). |
| Routing | `vue-router@4`, `createWebHistory(import.meta.env.BASE_URL)`. |
| State | Component state + `localStorage`. **Vuex is removed** (calculators never used it). |
| Styling | Tailwind CSS 3 + PostCSS, reusing the original `base/components/theme` CSS and CSS-variable theming. |
| Icons | Font Awesome via `@fortawesome/vue-fontawesome@3` (Vue 3 build), only the icons actually used. |
| Data | `supplies.js`, `supplies-common.js`, `supplies-eternals.js`, `supplies-evokers.js` carried over from GranblueParty (frozen data, no API); since v1.1, `supplies.js` is trimmed to referenced entries (§8). |
| Images | Item images in `public/img/item/`, referenced via `import.meta.env.BASE_URL`; since v1.1, swept to the images `supplies.js` references (one `<key>.<jpg\|gif>` per item). Regenerable by WikiParser. |
| Deploy | GitHub Actions workflow → `actions/deploy-pages` on push to `main`. Since v1.2.6 the deep-link fallback is a dedicated rafgraph `public/404.html` redirect (auto-copied to `dist/`), not a copy of `index.html` (PRD/v1.2.md §11 S5). |
| License | GPL-3.0 retained (derivative work). |

### 6.1 Vue 2 → Vue 3 migration notes
- `.sync` props → `v-model:` arguments (`:prop.sync` → `v-model:prop`); components declare `emits`.
- Custom `v-model` (`value`/`input`) → `modelValue`/`update:modelValue` (Checkbox, Dropdown); `v-model.number` on components handled via `modelModifiers`.
- `this.$set` / `this.$delete` → plain property assignment / `delete` (Vue 3 proxy reactivity).
- SSR head mixin → per-page client-side `setHead()` helper (v1.0); replaced in v1.2.8 by a single router `afterEach` hook driven by `route.meta` (PRD/v1.2.md §12).
- Global axios mixin, `serverPrefetch`, entry-client/entry-server split → removed.

### 6.2 Repository layout
```
raziel-ledger/
├── PRD.md                   ← this document (core requirements + changelog + active-series detail)
├── PRD/                     ← archived version-series PRDs (completed series only)
│   └── v1.2.md              ← v1.2.x archive (2026-06-12 to 2026-06-14)
├── .github/workflows/deploy.yml
├── index.html               ← Vite entry
├── vite.config.js / tailwind.config.js / postcss.config.js
├── public/                  ← favicon.svg, img/item/*
├── src/
│   ├── main.js / App.vue
│   ├── router/
│   ├── pages/               ← Home, CalcEternal, CalcEvoker, NotFound
│   ├── components/          ← Calculator, CalcPreviewItem, CalcPreviewList, common/
│   ├── js/                  ← supplies data, utils, head helper
│   └── css/
├── scripts/                 ← check-item-images.js (npm test / prebuild)
└── WikiParser/              ← standalone item-image fetcher (update_img.py + data/supplies.images; not part of the web build)
```

The original `API/` folder is **not** carried over (G3).

## 7. Acceptance criteria

1. `npm run dev` serves the app locally; `npm run build` produces a static `dist/`.
2. Visiting `/raziel-ledger/` shows the homepage with working links to both calculators; both calculator routes render and work; unknown routes show a 404 page — including on full page reload (Pages 404 fallback).
3. Adding a unit, setting steps, editing quantities, toggling split/hide/display, and reloading the page restores all state.
4. No network calls to any API; no login UI anywhere.
5. `WikiParser/` is the standalone item-image fetcher (G4); `cd WikiParser && python3 update_img.py` re-downloads nothing when all icons are present and exits 0.
6. Push to `main` deploys to GitHub Pages automatically.

---

## 8. Changelog

Each released version is summarised in the table below. The active series (v1.3.x, from 2026-06-21) is documented in this file; detailed specs for completed series are archived in [`PRD/`](PRD/):

- [`PRD/v1.2.md`](PRD/v1.2.md) — v1.2.x archive (2026-06-12 to 2026-06-14)

Per the versioning policy, every release bumps `package.json` `version` to the same `x.y.z` in the same change set (single source of truth for the app version) and syncs `CLAUDE.md` / `README.md`.

| Version | Date | Summary |
|---------|------|---------|
| 1.3.0 | 2026-06-21 | **Supplies import, per-unit "focus" & inventory UI.** Added sidebar Import view, ★ focus button, `reactive` inventory store (`src/js/inventory.js`), dismissable confirm dialog, Supplies sidebar (`InventorySidebar.vue`), navbar focus chip with Eternal-tab badge, `/import-guide` page, and What's new popup. |

### 8.1 Constraints that persist

- **`rustedweapon` is the single allowed unused item.** A reference walk over `supplies.js` + the three data files must report exactly **1 unused item** (`rustedweapon`), 0 unused groups, 0 dangling references — not treat it as new dead data.
- **`silvershardgauntlet.jpg`** is the (renamed) icon for Silver Gauntlet Shard; the upstream file was `silvershardmelee.jpg`.
- **`localStorage` keys are frozen** for back-compat: `CalcEternal-progress` (recruit/transcend), `CalcEternal-radianceProgress` (Radiance), `CalcEternal-activeTab`, `CalcEvoker-*`, shared `App-*`/UI toggles. Do not rename them.
- **`public/img/item/` is one image per item** — `<key>.jpg`, or `<key>.gif` for the 4 animated items (`loworb`, `trueanima`, `whorl`, `rustedweapon`). `check-item-images.js` (npm `test` / `prebuild`) enforces this for all 316 items; it does not cover `favicon.svg`.
- **`WikiParser/data/supplies.images`** is the hand-authored `URL⇥dest` manifest (no comment/blank lines — `download()` splits each on `\t`). The 4 animated `.gif` items are excluded (different source). `download(manifest, dest_dir)` skips files that already exist, so re-running is a no-op; manifest URLs are unverified against the live source. `goldbrick` and `sunlightstone` use `item/evolution/s/` (not `item/article/s/`).
- **WikiParser is a standalone item-image fetcher** (PRD/v1.2.md §10): `update_img.py` reads `data/supplies.images` and writes `public/img/item/`; it no longer carries the upstream DB/preview/wiki-scrape pipeline and is no longer "preserved verbatim."
