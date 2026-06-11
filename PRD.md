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
| G4 | **Preserve WikiParser** unchanged in the repository for later use (it generates the game data and item images from gbf.wiki). |
| G5 | Keep feature parity for the two calculators: unit selection, completed/target step ranges, split/merged materials, hide-completed filter, grid/list display, per-item quantity tracking, and `localStorage` persistence. |

## 3. Non-goals

- Party Builder, Collection Tracker, Daily Grind, Spark, Teams, Search, Replicard, Friend Summons, Release Schedule, Room Name, and the other calculators (Bullets, GW, Dread, Event) are **not** ported.
- No user accounts, login, signup, or JWT handling (G3).
- No ads, analytics, or consent management.
- No server-side rendering; SEO meta tags are set client-side only.
- No translation/JP-names toggle (the dropped pages were the main consumers; calculator data is English).

## 4. Users

Granblue Fantasy players tracking multi-month grinds for Eternals/Evokers. They visit periodically, update material counts, and rely on their progress being remembered between visits **on the same browser** (localStorage; no cross-device sync, which is acceptable without accounts).

## 5. Functional requirements

### 5.1 Routing (SPA)
- `/` → homepage with two prominent entries ("Eternals Calculator" / "Evokers Calculator") linking to the calculator routes.
- `/calceternal` → Eternals calculator.
- `/calcevoker` → Evokers calculator.
- Any other path → 404 page with a link back home.
- HTML5 history mode. GitHub Pages serves a copy of `index.html` as `404.html` so deep links resolve to the SPA router.
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
| Images | Item images in `public/img/item/`, referenced via `import.meta.env.BASE_URL`; since v1.1, swept to the images `supplies.js` references (302 files, §8). Regenerable later by WikiParser. |
| Deploy | GitHub Actions workflow → `actions/deploy-pages` on push to `main`; build step copies `dist/index.html` → `dist/404.html`. |
| License | GPL-3.0 retained (derivative work). |

### 6.1 Vue 2 → Vue 3 migration notes
- `.sync` props → `v-model:` arguments (`:prop.sync` → `v-model:prop`); components declare `emits`.
- Custom `v-model` (`value`/`input`) → `modelValue`/`update:modelValue` (Checkbox, Dropdown); `v-model.number` on components handled via `modelModifiers`.
- `this.$set` / `this.$delete` → plain property assignment / `delete` (Vue 3 proxy reactivity).
- SSR head mixin → small client-side `setHead()` helper (title + meta description).
- Global axios mixin, `serverPrefetch`, entry-client/entry-server split → removed.

### 6.2 Repository layout
```
raziel-ledger/
├── PRD.md                   ← this document
├── .github/workflows/deploy.yml
├── index.html               ← Vite entry
├── vite.config.js / tailwind.config.js / postcss.config.js
├── public/                  ← favicons, img/item/*
├── src/
│   ├── main.js / App.vue
│   ├── router/
│   ├── pages/               ← Home, CalcEternal, CalcEvoker, NotFound
│   ├── components/          ← Calculator, CalcPreviewItem, CalcPreviewList, common/
│   ├── js/                  ← supplies data, utils, head helper
│   └── css/
└── WikiParser/              ← preserved verbatim (Python, not part of the web build)
```

The original `API/` folder is **not** carried over (G3).

## 7. Acceptance criteria

1. `npm run dev` serves the app locally; `npm run build` produces a static `dist/`.
2. Visiting `/raziel-ledger/` shows the homepage with working links to both calculators; both calculator routes render and work; unknown routes show a 404 page — including on full page reload (Pages 404 fallback).
3. Adding a unit, setting steps, editing quantities, toggling split/hide/display, and reloading the page restores all state.
4. No network calls to any API; no login UI anywhere.
5. `WikiParser/` content is byte-identical to the source project.
6. Push to `main` deploys to GitHub Pages automatically.

---

## 8. Version 1.1 — Cleanup (signed off & implemented 2026-06-11)

### 8.1 Problem

Two leftovers from the v1.0 port:

1. The site ships a favicon (three files in `public/`, three `<link rel="icon">` tags in
   `index.html`) that should be removed.
2. `src/js/supplies.js` was carried over verbatim from GranblueParty and may contain item
   definitions that none of the calculator data files reference.

### 8.2 Analysis (2026-06-11)

Item references occur two ways: directly (`{"item":"x"}`) and indirectly via group resolution
(`{"group":"y"}` → item keys listed in `supplies.js` `groups`). A script walking both forms across
`supplies-eternals.js`, `supplies-evokers.js`, and `supplies-common.js` found:

- All **41 groups** are referenced.
- **301 of 302 items** are referenced. The only dead entry is **`rustedweapon`**
  ("Rusted Weapon", the animated generic icon) — the eternals data references the ten concrete
  rusted weapons via the `rustedw` group, never the generic item.
- No references point to nonexistent items (data is internally consistent).

**Image audit:** components build item-image URLs from the item key
(`img/item/<key>.jpg`, or `.gif` when `animated`). `public/img/item/` holds **493** files but the
post-cleanup supplies.js references only **301** — the remaining **192 are orphans**, mostly
leftovers of GranblueParty pages that were not ported (e.g. the Bullets calculator's `agnipoint*`,
`armorpiercing*`). Two anomalies:

- `rustedweapon.gif` would have been orphaned by C2; after the C2 revert, the item and its gif
  both remain and the gif is an ordinary referenced image (see 8.4).
- The kept item `silvershardgauntlet` has **no matching image** — the file exists as
  `silvershardmelee.jpg`, so the item renders a broken image in v1.0 already. A blind sweep would
  delete the file and make the bug permanent; C4 renames it instead.

**Favicon dependency:** `src/App.vue` uses `favicon-32.png` as the navbar home-button image, so
favicon removal is not a pure deletion (see open question O1).

### 8.3 Scope

| # | Change |
|---|--------|
| C1 | Remove the three `<link rel="icon">` tags from `index.html` and delete `public/favicon.ico`, `public/favicon-32.png`, `public/favicon-96.png`. Resolve the App.vue navbar dependency per O1. |
| C2 | ~~Remove the `rustedweapon` entry from `src/js/supplies.js`~~ **Reverted by user decision 2026-06-11**: the entry stays as the single known-unused item. With it restored, `rustedweapon.gif` is a referenced image again, so the C4 sweep needs no exception. |
| C3 | Docs sync: update the §6 Data row ("carried over verbatim" no longer strictly true for `supplies.js`), fix the stale `docs/PRD.md` paths in §6.2, `README.md`, and `CLAUDE.md` (the PRD now lives at the repo root), and reflect C1/C2/C4 in `README.md` and `CLAUDE.md`. |
| C4 | After C2, delete every file in `public/img/item/` whose name is not `<itemKey>.jpg` / `<itemKey>.gif` (per the item's `animated` flag) for an item key present in the cleaned `supplies.js` — **except `rustedweapon.gif`, which is kept** (explicit user decision overriding the rule). 192 orphans as of the 2026-06-11 audit. Before sweeping, rename `silvershardmelee.jpg` → `silvershardgauntlet.jpg` to fix the pre-existing broken image for Silver Gauntlet Shard. |

**Out of scope:** WikiParser stays untouched (G4 — it regenerates the full upstream data set, and
that is fine); no other `supplies.js` entries are removed (everything else is referenced); images
outside `public/img/item/` are not audited in this version.

### 8.4 Constraints

- Removing the favicon files means browsers' automatic `/favicon.ico` probe will 404. Harmless,
  but it is a deliberate consequence of this version, not a bug.
- **`rustedweapon` exception (user decision, 2026-06-11, superseding the original C2):** the
  entry stays in `supplies.js` although nothing references it — it is the single allowed unused
  item. A future re-run of the reference walk must treat it as expected, not as new dead data.
  Because the item exists, its `rustedweapon.gif` is part of the ordinary sweep keep-list; no
  image-level exception is needed.
- The C4 sweep derives the keep-list from `supplies.js`, and is performed with the rename of
  `silvershardmelee.jpg` done first (order matters, or the rename target would be swept).

### 8.5 Open questions

- **O1 — navbar home button** *(RESOLVED 2026-06-11)*: `App.vue`'s navbar shows `favicon-32.png`
  as the home/logo image. **Decision: replace it with the Font Awesome book icon** (`faBook` from
  `@fortawesome/free-solid-svg-icons`, registered in `src/main.js` alongside the existing solid
  icons), fitting the "Ledger" name. The `faviconUrl` data property in `App.vue` is removed with
  it.

### 8.6 Acceptance criteria

1. No `<link rel="icon">` tags in `index.html`; no `favicon*` files under `public/`; the browser
   tab shows no site icon.
2. The navbar still has a working home affordance (per O1 resolution).
3. The reference walk over `supplies.js` and the three data files reports exactly **1 unused item
   (`rustedweapon`, the allowed exception per 8.4)**, 0 unused groups, and 0 dangling references.
4. `public/img/item/rustedweapon.gif` still exists (referenced by the kept `rustedweapon` item).
5. Every remaining file in `public/img/item/` matches an item key in `supplies.js` with the
   correct extension; expected count: **302 files** (one per item).
6. Every item key in the cleaned `supplies.js` has its image file present — including
   `silvershardgauntlet.jpg` (renamed from `silvershardmelee.jpg`).
7. Both calculators render every step of every unit without console errors or broken images.
8. `npm run build` passes; README.md and CLAUDE.md reflect the changes (C3).
