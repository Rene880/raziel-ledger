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
| G4 | **WikiParser is the standalone item-image fetcher** (`WikiParser/update_img.py` + `data/supplies.images`): it downloads the calculators' item icons into `public/img/item/` from a hand-authored manifest. Reduced from the upstream wiki-scrape/Postgres pipeline in v1.2.5 (§10); remains GPL-3.0. |
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
| Images | Item images in `public/img/item/`, referenced via `import.meta.env.BASE_URL`; since v1.1, swept to the images `supplies.js` references (one `<key>.<jpg\|gif>` per item). Regenerable by WikiParser. |
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

Each released version adds a `## N. Version x.y.z` heading; the table below is the durable summary, and **§8.1 lists the constraints later work must respect**. Per the versioning policy, every release bumps `package.json` `version` to the same `x.y.z` in the same change set (single source of truth for the app version) and syncs `CLAUDE.md` / `README.md`.

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | 2026-06 | Initial Vue 3 + Vite port of the two calculators from GranblueParty (§1–§7). |
| 1.1 | 2026-06-11 | Cleanup: trimmed `supplies.js` to the **301 referenced** items + 41 groups, keeping **`rustedweapon`** as the single deliberately-unused item; renamed `silvershardmelee.jpg` → **`silvershardgauntlet.jpg`** (pre-existing broken image) before sweeping `public/img/item/` to one image per item; removed the v1.0 favicon (later reinstated in 1.2.3). |
| 1.2 | 2026-06-12 | **Eternals Radiance tab** (levels 1–5): added `ETERNALS_DATA.radiance` (sibling of `materials`), 2 element groups (`enneadomegaanima`, `omega3omegaanima`) + new items (incl. `immortalfragment`, `terraadamant`), and a tab switcher rendering a second `<calculator>` instance. `Calculator.vue` unchanged. Element assignment in the new groups is positional (fire…dark). 14 new icons fetched into `public/img/item/`. |
| 1.2.1 | 2026-06-14 | Footer & nav polish: footer `granblue.party` link → **gbf.wiki** (Minimalist3/GranblueParty GPL-3.0 attribution kept); home cards gained item icons (`goldbrick.jpg` / `newworldquartz.jpg`); Radiance wiki link added to `/calceternal`; Eternals card copy updated. Established the **versioning policy** and synced `package.json` to `1.2.1`. |
| 1.2.2 | 2026-06-14 | Radiance reduce step corrected from "Reduce 10 Revenant Weapon" to **"Reduce 4 Revenant Weapon"**; every quantity in that step scaled ×0.4. Recruit/transcend reduce steps untouched. |
| 1.2.3 | 2026-06-14 | **Item-image manifest + build-time check.** Added `WikiParser/data/supplies.images` (one `URL⇥<key>.jpg` per static item; `radiance.images` folded in and deleted); added `scripts/check-item-images.js`, wired as npm `test` / `prebuild` (a missing icon fails the build) and a committed `.githooks/pre-commit` (via the `prepare` script; bypassable with `--no-verify`). Reintroduced a browser favicon `public/img/favicon.svg` (`faBook` glyph), **superseding the v1.1 no-favicon decision**. |
| 1.2.4 | 2026-06-14 | **CDN image source, homepage lettering & icon refresh.** Added `itemId` to 282 `supplies.js` items; repointed `supplies.images` at the official CDN (weapon path for 30 weapons; fixed `goldbrick`/`sunlightstone` to `item/evolution/s/`); refreshed 190 icons (fixed 10 broken revenant, upgraded all 30 weapon icons to 260×260 px, synced 160 others); added theme-aware "Raziel Ledger" SVG calligraphy to home page (`fill: currentColor`). See §9. |
| 1.2.5 | 2026-06-14 | **WikiParser reduced to a standalone item-image fetcher.** Trimmed `WikiParser/data/` to `supplies.images`; deleted `db/`, `preview/`, and the now-orphaned upstream pipeline (`database.py`, `parse.py`, `bullets.py`, `migration.py`, `make_party_preview.py`, `optimize_img.py`, `config/`, `update.sh`, `pyproject.toml`, `pdm.lock`, preview assets); rewrote `update_img.py` as a config-free fetcher (manifest → `public/img/item/`, `download(manifest, dest_dir)` preserved for `/download-images`); trimmed `requirements.txt` to `requests`. **Redirects G4** ("preserve verbatim" → standalone fetcher). See §10. |

### 8.1 Constraints that persist

- **`rustedweapon` is the single allowed unused item.** A reference walk over `supplies.js` + the three data files must report exactly **1 unused item** (`rustedweapon`), 0 unused groups, 0 dangling references — not treat it as new dead data.
- **`silvershardgauntlet.jpg`** is the (renamed) icon for Silver Gauntlet Shard; the upstream file was `silvershardmelee.jpg`.
- **`localStorage` keys are frozen** for back-compat: `CalcEternal-progress` (recruit/transcend), `CalcEternal-radianceProgress` (Radiance), `CalcEternal-activeTab`, `CalcEvoker-*`, shared `App-*`/UI toggles. Do not rename them.
- **`public/img/item/` is one image per item** — `<key>.jpg`, or `<key>.gif` for the 4 animated items (`loworb`, `trueanima`, `whorl`, `rustedweapon`). `check-item-images.js` (npm `test` / `prebuild`) enforces this for all 316 items; it does not cover `favicon.svg`.
- **`WikiParser/data/supplies.images`** is the hand-authored `URL⇥dest` manifest (no comment/blank lines — `download()` splits each on `\t`). The 4 animated `.gif` items are excluded (different source). `download(manifest, dest_dir)` skips files that already exist, so re-running is a no-op; manifest URLs are unverified against the live source. `goldbrick` and `sunlightstone` use `item/evolution/s/` (not `item/article/s/`).
- **WikiParser is a standalone item-image fetcher** (§10): `update_img.py` reads `data/supplies.images` and writes `public/img/item/`; it no longer carries the upstream DB/preview/wiki-scrape pipeline and is no longer "preserved verbatim."

---

## 9. Version 1.2.4 — CDN image source, homepage lettering & icon refresh (2026-06-14)

### 9.1 Problem

`supplies.js` items had no link to their in-game GBF id, and `supplies.images` sourced every icon from `gbf.wiki` redirects (error-prone, third-party). 190 icons in `public/img/item/` were stale or corrupted from those original downloads (10 revenant weapons were 1.4–1.7 KB placeholders; all 30 weapon icons were 130×130 px vs. CDN's 260×260 px; two manifest paths 404'd). The homepage lacked brand identity.

### 9.2 Scope

| # | Change |
|---|--------|
| V1 | Add an optional `itemId` constructor arg to the `Item` class in `supplies.js` (`new Item(name, category, itemId, animated)`; the 4 animated items move their `true` to the 4th position). |
| V2 | Populate `itemId` for the **282** items resolvable by name from the GBF API dumps. `goldbrick` (`20004`) and `sunlightstone` (`20014`) come from the recovery dump; `rupie` and `crystal` use the CDN filenames **`lupi`** / **`gem`** as their id. |
| V3 | Repoint the **282** matched lines in `WikiParser/data/supplies.images` to the official CDN (`item/article/s/<itemId>.jpg`; exceptions: `item/normal/s/` for `rupie`/`crystal`, `item/evolution/s/` for `goldbrick`/`sunlightstone`). All 30 weapons repointed to `weapon/s/<weaponId>.jpg`. The 4 `.gif` items remain excluded. |
| V4 | Refresh all 190 divergent icons in `public/img/item/` with CDN-authoritative files: fix 10 broken revenant weapon icons (1.4–1.7 KB placeholders → real 15–40 KB images), upgrade all 30 weapon icons to 260×260 px, and sync 160 other item icons (animas, omega animas, distinctions, gospels, veritas, ideans, etc.). |
| V5 | Move the reference API dumps into a git-ignored `response-example/` folder. |
| V6 | Add `public/img/raziel-ledger-lettering.svg` — hand-authored "Raziel Ledger" in Great Vibes calligraphy, `fill: currentColor`. Inline the SVG in `src/pages/Home.vue` with `class="text-primary"` so it inherits `--color-text-primary` and adapts to all three themes. Load Google Fonts (Great Vibes) globally in `index.html`. |
| V7 | Bump `package.json` `version` to **1.2.4**; sync `CLAUDE.md` and `README.md`. |

### 9.3 Items without an `itemId`

Only the **4 animated `.gif` items** (`loworb`, `trueanima`, `whorl`, `rustedweapon`) carry no `itemId` — they are excluded from the manifest (different source, §8.1).

The **30 weapon-namespace items** (10 rusted weapons, 10 silver **relics**, 10 revenant weapons) now carry their **weapon id** as `itemId` (rusted `1030…`, silver relics + revenant `1040…`; extracted from the manifest's weapon-path URLs). Unlike every other item, this id resolves on the CDN **weapon path** (`.../assets/weapon/s/<itemId>.jpg`) rather than `item/article/s/`; the manifest is unchanged. Full reference: `About items.md`.

### 9.4 Notes & constraints

- The CDN URLs are **unverified against the live game** (same caveat as §8.1); all 312 static icons now exist locally at their CDN-authoritative version, so `download()` is a no-op unless a file is deleted.
- `public/img/raziel-ledger-lettering.svg` is hand-authored — not a game asset; must not be overwritten by WikiParser's `download()` or the CDN manifest. `text-primary` maps to `var(--color-text-primary)` (Tailwind config); `fill: currentColor` in the inlined SVG inherits that value across all three CSS-variable themes.

### 9.5 Acceptance criteria

1. Every static `supplies.js` item carries an `itemId` — the **282** item-path items plus the **30** weapon-namespace items (their weapon id, on the weapon path); only the **4** animated `.gif` items carry none. `npm test` reports `✓ All 316 item icons present`.
2. `supplies.images` has **312** akamaized lines — 282 on `item/...` (incl. `rupie`/`crystal` on `normal/s/`, `goldbrick`/`sunlightstone` on `evolution/s/`) plus all 30 weapons on `weapon/s/<itemId>.jpg` — and **0** gbf.wiki lines.
3. All 10 revenant weapon icons are valid JPEGs ≥ 15 KB.
4. `/` homepage displays "Raziel Ledger" in Great Vibes calligraphy; switching themes changes the lettering color.
5. `response-example/` holds both JSON dumps and is git-ignored.
6. `package.json` `version` is `1.2.4`; `CLAUDE.md` and `README.md` reflect v1.2.4.
</content>
</invoke>

## 10. Version 1.2.5 — WikiParser reduced to a standalone item-image fetcher (2026-06-14)

### 10.1 Problem
WikiParser still carried the full upstream GranblueParty pipeline (Postgres DB layer,
wiki scraping for chara/summon/weapon, party-preview server) even though Raziel Ledger
only ever uses it to download item icons from a hand-authored manifest. G4's "preserve
unchanged" rule had frozen ~2,000 lines of dead Python and ~6 MB of unused data.

### 10.2 Scope
| # | Change |
|---|--------|
| A | Trim `WikiParser/data/` to `supplies.images` only (12 unused data files removed). |
| B | Delete `WikiParser/db/` (Postgres seed CSVs) and `WikiParser/preview/` (party-preview server). |
| C | Delete now-orphaned Python + tooling: `database.py`, `parse.py`, `bullets.py`, `migration.py`, `make_party_preview.py`, `optimize_img.py`, `config/`, `update.sh`, `pyproject.toml`, `pdm.lock`, and the preview assets (`NotoSans-Regular.ttf`, `star_{b,y}.png`). |
| D | Rewrite `update_img.py` as a standalone fetcher: reads a `URL⇥dest` manifest (default `data/supplies.images`), downloads into `../public/img/item/` (both overridable via argv), skips existing files, writes only on HTTP 200. No `config` import, no previews. `download(manifest, dest_dir)` signature preserved for the `/download-images` skill. |
| E | Trim `requirements.txt` to `requests`. |

### 10.3 Notes & constraints
- **G4 is redirected, not dropped:** WikiParser is now a standalone item-image fetcher, no
  longer "preserved verbatim." The `/download-images` skill and PRD §6.2/§8.1/§7 are updated to match.
- WikiParser remains GPL-3.0 (upstream attribution + `LICENSE` retained).
- Item icons are still CDN-authoritative (v1.2.4); this version changes only the fetcher, not the manifest.

### 10.4 Acceptance criteria
1. `WikiParser/` contains only `update_img.py`, `data/supplies.images`, `requirements.txt`, `README.md`, `LICENSE`.
2. `cd WikiParser && python3 update_img.py` re-downloads nothing (all icons present) and exits 0.
3. `npm test` passes (every `supplies.js` item has its `public/img/item/<key>` icon — 316 items).
4. No remaining repo reference tells the reader WikiParser `.py` is immutable.
5. `package.json` `version` is `1.2.5`; `CLAUDE.md` and `README.md` reflect v1.2.5.
