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
- No server-side rendering. Since v1.2.6 (§11) the social-preview/SEO meta tags (title, description, canonical, Open Graph, Twitter Card) are **static** in `index.html` so non-JS scrapers can read them; v1.2.8 (§12) added a runtime per-route `afterEach` hook, and v1.2.9 (§13) added build-time pre-rendered per-route HTML (`dist/calceternal`, `dist/calcevoker`) so scrapers get per-page cards — all without SSR.
- No translation/JP-names toggle (the dropped pages were the main consumers; calculator data is English).

## 4. Users

Granblue Fantasy players tracking multi-month grinds for Eternals/Evokers. They visit periodically, update material counts, and rely on their progress being remembered between visits **on the same browser** (localStorage; no cross-device sync, which is acceptable without accounts).

## 5. Functional requirements

### 5.1 Routing (SPA)
- `/` → homepage with two prominent entries ("Eternals Calculator" / "Evokers Calculator") linking to the calculator routes.
- `/calceternal` → Eternals calculator.
- `/calcevoker` → Evokers calculator.
- Any other path → 404 page with a link back home.
- HTML5 history mode. Since v1.2.6 (§11) GitHub Pages serves a dedicated rafgraph `404.html` redirect that bounces unknown paths to `…/?/<path>` (a 200 home document), which `index.html` rewrites back to the real path before the router boots — so deep links resolve to the SPA router on a 200 document. (Pre-1.2.6 this was a verbatim copy of `index.html`.)
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
| Deploy | GitHub Actions workflow → `actions/deploy-pages` on push to `main`. Since v1.2.6 the deep-link fallback is a dedicated rafgraph `public/404.html` redirect (auto-copied to `dist/`), not a copy of `index.html` (§11 S5). |
| License | GPL-3.0 retained (derivative work). |

### 6.1 Vue 2 → Vue 3 migration notes
- `.sync` props → `v-model:` arguments (`:prop.sync` → `v-model:prop`); components declare `emits`.
- Custom `v-model` (`value`/`input`) → `modelValue`/`update:modelValue` (Checkbox, Dropdown); `v-model.number` on components handled via `modelModifiers`.
- `this.$set` / `this.$delete` → plain property assignment / `delete` (Vue 3 proxy reactivity).
- SSR head mixin → per-page client-side `setHead()` helper (v1.0); replaced in v1.2.8 by a single router `afterEach` hook driven by `route.meta` (§12).
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
| 1.2.6 | 2026-06-14 | **Static SEO / social-preview meta.** Added static `<head>` tags to `index.html` — canonical URL, Open Graph (`og:type/url/title/description/image`), and Twitter Card (`summary_large_image`) — pointing at the production URL `https://rene880.github.io/raziel-ledger/`, plus a `1200×630` `public/img/og-preview.png` link-preview image. No SSR, no runtime per-route meta; scope deliberately excludes robots.txt/sitemap (a project-subpath `robots.txt` is not honored — crawlers read `https://rene880.github.io/robots.txt`, owned by the root user-page repo). See §11. |
| 1.2.5 | 2026-06-14 | **WikiParser reduced to a standalone item-image fetcher.** Trimmed `WikiParser/data/` to `supplies.images`; deleted `db/`, `preview/`, and the now-orphaned upstream pipeline (`database.py`, `parse.py`, `bullets.py`, `migration.py`, `make_party_preview.py`, `optimize_img.py`, `config/`, `update.sh`, `pyproject.toml`, `pdm.lock`, preview assets); rewrote `update_img.py` as a config-free fetcher (manifest → `public/img/item/`, `download(manifest, dest_dir)` preserved for `/download-images`); trimmed `requirements.txt` to `requests`. **Redirects G4** ("preserve verbatim" → standalone fetcher). See §10. |
| 1.2.8 | 2026-06-14 | **Per-route titles/meta + sitemap.** Added a vue-router `afterEach` hook (`src/router/index.js`) that sets a distinct `document.title`, `description`, `canonical`, and `og:`/`twitter:` title/description/url per route (Home, Eternals, Evokers, NotFound) from `route.meta`; the static `index.html` tags remain the scraper-facing defaults. Added `public/sitemap.xml` (the three real routes, absolute production URLs) for manual submission in Google Search Console — partially reversing 1.2.6's "no sitemap" scope (a subpath sitemap isn't auto-discovered but is valid when submitted directly). Removed a stray `</content>`/`</invoke>` artifact from PRD §9 and condensed §9. See §12. |
| 1.2.9 | 2026-06-14 | **Per-route static social previews (build-time pre-render).** Fixed `/calceternal` and `/calcevoker` unfurling with **no** link-preview card: they were served from GitHub's `404.html` (no OG tags; the 1.2.8 JS `afterEach` can't help scrapers). Extracted the route SEO table into a shared plain module (`src/seo/meta.js`) consumed by both the router and a new `scripts/prerender-routes.js` (`postbuild`) that clones the built `dist/index.html` into `dist/calceternal/index.html` and `dist/calcevoker/index.html` with each route's static `<title>`/`title`/`description`/`canonical`/`og:`/`twitter:` title-description-url swapped in (OG **image** stays the sitewide `og-preview.png`). Those routes now serve a real **200** file with correct static tags; the rafgraph `404.html` redirect remains only for genuinely unknown paths. No new dependency, no SSR. See §13. |
| 1.2.10 | 2026-06-14 | **Self-hosted subsetted homepage font.** Replaced the render-blocking Google Fonts chain (two `preconnect`s + a css2 `<link>` → ~1.3 s cross-origin DNS/TLS for a 29.70 KiB woff2) with a self-hosted `public/fonts/great-vibes-subset.woff2` (~6 KB) — Great Vibes (OFL) subset to the 11 hero glyphs in "Raziel Ledger". `index.html` now declares an inline `@font-face` (`font-display: swap`) + a `<link rel="preload" as="font" crossorigin>`, both via `%BASE_URL%`. `scripts/prerender-routes.js` strips the preload from the calc-route pre-renders (font unused there). No Google request at runtime; the hero font loads same-origin on the existing connection. See §14. |
| 1.2.11 | 2026-06-21 | **Supplies import, per-unit "focus" & inventory UI.** Added a navbar **Import supplies** dialog (`SuppliesImport.vue`, paste or `.json` file) that parses the in-game item-list response (`response-example/supplies-response.json` shape) into a `{ key: count }` stock map by matching each `item_id` to the `itemId` on `supplies.js` items (278 match; weapons/currency/evolution items skipped). Added a ★ **focus** button on every calculator unit box that spends that stock against the unit's selected step range (fills progress, earliest step first). Focus is **global + single** (one unit app-wide); switching focus resets the previous unit (restores progress, returns stock) before applying. New `reactive` store `src/js/inventory.js` (no Vuex), persisted under `App-inventory`; pages register their progress with it via the new `calcId` prop on `Calculator.vue`. Supporting UI: a dismissable confirm dialog on the ★ warning that focus/unfocus overwrites tracked quantities (persisted `warningDismissed`); a global collapsible right **Supplies** sidebar (`InventorySidebar.vue`) listing every owned item as `remaining / owned` (sorted by category then name; open state under `App-sidebarOpen`); and a navbar **focus chip** (★ + active unit name, rightmost of the left nav group) that routes to its calc (Eternal tab via `?tab=recruit|radiance`). The store carries an `owned` baseline (imported totals, distinct from focus-decremented `stock`), `state.active.name`, `inventoryList()`, and `dismissWarning()`. New FA icons `faStar`, `faFileImport`, `faXmark`, `faWarehouse`, `faTriangleExclamation`. See §15. |

### 8.1 Constraints that persist

- **`rustedweapon` is the single allowed unused item.** A reference walk over `supplies.js` + the three data files must report exactly **1 unused item** (`rustedweapon`), 0 unused groups, 0 dangling references — not treat it as new dead data.
- **`silvershardgauntlet.jpg`** is the (renamed) icon for Silver Gauntlet Shard; the upstream file was `silvershardmelee.jpg`.
- **`localStorage` keys are frozen** for back-compat: `CalcEternal-progress` (recruit/transcend), `CalcEternal-radianceProgress` (Radiance), `CalcEternal-activeTab`, `CalcEvoker-*`, shared `App-*`/UI toggles. Do not rename them.
- **`public/img/item/` is one image per item** — `<key>.jpg`, or `<key>.gif` for the 4 animated items (`loworb`, `trueanima`, `whorl`, `rustedweapon`). `check-item-images.js` (npm `test` / `prebuild`) enforces this for all 316 items; it does not cover `favicon.svg`.
- **`WikiParser/data/supplies.images`** is the hand-authored `URL⇥dest` manifest (no comment/blank lines — `download()` splits each on `\t`). The 4 animated `.gif` items are excluded (different source). `download(manifest, dest_dir)` skips files that already exist, so re-running is a no-op; manifest URLs are unverified against the live source. `goldbrick` and `sunlightstone` use `item/evolution/s/` (not `item/article/s/`).
- **WikiParser is a standalone item-image fetcher** (§10): `update_img.py` reads `data/supplies.images` and writes `public/img/item/`; it no longer carries the upstream DB/preview/wiki-scrape pipeline and is no longer "preserved verbatim."

---

## 9. Version 1.2.4 — CDN image source, homepage lettering & icon refresh (2026-06-14)

*Condensed (older than the latest three releases — see the §8 changelog row and §8.1 constraints for the durable summary).* Added an optional `itemId` to the `supplies.js` `Item` class and populated it for the **282** item-path items plus the **30** weapon-namespace items (their weapon id, resolved on the CDN **weapon path** `.../assets/weapon/s/<itemId>.jpg`, not `item/article/s/`); only the **4** animated `.gif` items carry none. Repointed `WikiParser/data/supplies.images` to the official Akamai CDN (`item/article/s/`, with `item/normal/s/` for `rupie`/`crystal` and `item/evolution/s/` for `goldbrick`/`sunlightstone`) and refreshed 190 divergent icons. Moved the API dumps into a git-ignored `response-example/`. Added the hand-authored, theme-aware `public/img/raziel-ledger-lettering.svg` (Great Vibes, `fill: currentColor`), inlined in `Home.vue`. Full id reference: `About items.md`.

## 10. Version 1.2.5 — WikiParser reduced to a standalone item-image fetcher (2026-06-14)

*Condensed (older than the latest three releases — see the §8 changelog row and §8.1 constraints for the durable summary).* Stripped WikiParser from the full upstream GranblueParty pipeline (Postgres DB layer, wiki scraping, party-preview server — ~2,000 lines of dead Python and ~6 MB of unused data) down to a standalone item-image fetcher: trimmed `WikiParser/data/` to `supplies.images` only, deleted `db/`/`preview/` and the orphaned tooling (`database.py`, `parse.py`, `bullets.py`, `migration.py`, `make_party_preview.py`, `optimize_img.py`, `config/`, `update.sh`, `pyproject.toml`, `pdm.lock`, preview assets), trimmed `requirements.txt` to `requests`, and rewrote `update_img.py` as a config-free fetcher (manifest → `public/img/item/`, skips existing files, `download(manifest, dest_dir)` preserved for `/download-images`). **Redirects G4** ("preserve verbatim" → standalone fetcher); WikiParser stays GPL-3.0.

---

## 11. Version 1.2.6 — Static SEO / social-preview meta (2026-06-14)

*Condensed (older than the latest three releases — see §12–§14 and the durable SEO notes in CLAUDE.md.)* Added static `<head>` tags to `index.html` — `<link rel="canonical">`, Open Graph (`og:type=website`, `og:url/title/description/image` + `og:image:width/height`), and Twitter Card (`summary_large_image`) — all hardcoding the absolute production origin `https://rene880.github.io/raziel-ledger/` (a subpath base makes relative OG URLs unreliable, and scrapers don't run JS). Added the hand-authored `public/img/og-preview.png` (1200×630, "Raziel Ledger" in Great Vibes on the dark theme, rendered with PIL from the upstream TTF) — not a game asset, outside `check-item-images.js`. Replaced the `cp dist/index.html dist/404.html` deep-link step with a dedicated rafgraph `public/404.html` redirect (`?/<path>`, `pathSegmentsToKeep=1`) plus the matching decode snippet in `index.html`, so deep links resolve to a 200 home document with the URL normalized before the router boots (the first GitHub response for an unknown path is still 404 — a Pages limitation). `robots.txt`/`sitemap.xml` deliberately omitted then (subpath files aren't auto-discovered). Bumped to 1.2.6.

---

## 12. Version 1.2.8 — Per-route titles/meta + sitemap (2026-06-14)

*Condensed (older than the latest three releases — see the §8 changelog row and §8.1 constraints for the durable summary).* Gave each route in `src/router/index.js` a `meta: { title, description }` (Home / Eternals / Evokers / NotFound) and added a `router.afterEach` hook that sets `document.title` and updates the in-document `<meta name="title|description">`, `<link rel="canonical">`, and `og:`/`twitter:` title/description/url per route (canonical/og `url` = absolute production URL; missing tags skipped). This **replaced** the per-page `setHead()` mechanism — removed the `mounted()` `setHead()` calls from all four pages and deleted `src/js/head.js` (previously `mounted()` ran after `afterEach` and silently overrode the route-meta title). Added `public/sitemap.xml` (the three real routes, absolute `loc`s; copied to `dist/sitemap.xml`) for **manual** Google Search Console submission — partially reversing 1.2.6's "no sitemap" decision (still true for *auto-discovery*; a subpath sitemap isn't crawled unprompted). No new dependency (the hook mutates pre-existing DOM tags); static `index.html` tags stay authoritative for no-JS scrapers, the hook benefits the tab title + Googlebot. `sitemap.xml` is not a game asset (outside `check-item-images.js`).

---

## 13. Version 1.2.9 — Per-route static social previews (build-time pre-render) (2026-06-14)

### 13.1 Problem

`/calceternal` and `/calcevoker` unfurl with **no** link-preview card when shared (Discord, X,
Slack, Facebook, iMessage), while the root `/` does show one. The cause is the interaction of two
earlier decisions:

- **The deep routes are served from GitHub's `404.html`** (§11.2 S5). A scraper requesting
  `https://rene880.github.io/raziel-ledger/calceternal` gets GitHub Pages' `404.html` — which carries
  **no** Open Graph / Twitter tags, only a rafgraph redirect script. Scrapers don't run JS, so the
  redirect never fires and there is nothing to unfurl. Only `/` resolves to the real `index.html`.
- **The 1.2.8 `afterEach` hook is JS-only** (§12.3). It updates per-route meta at runtime, which
  Googlebot and the browser tab see, but link-preview crawlers never execute it.

So 1.2.8 gave per-route titles to *JS-rendering* consumers but left non-JS scrapers with the single
static `index.html` card for `/` and **nothing at all** for the two calculator deep links.

SSR remains out of scope (§3). The fix is **build-time pre-rendering**: emit a real static HTML file
per route so GitHub Pages serves a 200 document with route-specific static tags — no server needed.

### 13.2 Scope

| # | Change |
|---|--------|
| S1 | Extract the route SEO metadata out of `src/router/index.js` into a shared, dependency-free module `src/seo/meta.js`: `SITE_ORIGIN`, `SITE_NAME`, `DEFAULT_TITLE`, `DEFAULT_DESCRIPTION`, `OG_IMAGE`, and a `ROUTES` table of `{ path, title, description }` for Home / `/calceternal` / `/calcevoker` / NotFound. `router/index.js` imports from it and keeps its `afterEach` hook unchanged — single source of truth shared with the pre-render script. |
| S2 | Add `scripts/prerender-routes.js`, run as a new `postbuild` npm script (after `vite build`). It reads the built `dist/index.html` and, for `/calceternal` and `/calcevoker`, writes `dist/<route>/index.html` with that route's static tags swapped in: `<title>`, `<meta name="title">`, `<meta name="description">`, `<link rel="canonical">`, `og:title`/`og:description`/`og:url`, and `twitter:title`/`twitter:description`. Plain string/regex replacement on the built HTML — no new dependency. |
| S3 | The OG/Twitter **image** stays the single sitewide `public/img/og-preview.png` (resolved decision — only title/description/url differ per route). `og:type`, `og:image:width/height`, `twitter:card`, the rafgraph decode snippet, and the hashed asset references are copied through unchanged. |
| S4 | Result: `/calceternal` and `/calcevoker` now serve a real **200** HTML file with correct static tags directly from GitHub Pages; they no longer fall through to `404.html`. The rafgraph `404.html` redirect (§11.2 S5) remains in place for genuinely unknown paths (→ NotFound). |
| S5 | Bump `package.json` `version` to **1.2.9**; sync `CLAUDE.md` and `README.md`. |

### 13.3 Notes & constraints

- **No new dependency, no SSR.** The script is plain Node (the project is already `"type": "module"`)
  doing text substitution on the built `index.html`; it imports the same `src/seo/meta.js` the router
  uses, so titles can never drift between the JS hook and the pre-rendered files.
- **Static tags are now per-route, not sitewide.** This supersedes the §12.3 note that scrapers "still
  read the static `index.html` defaults (the Home values)" — that remains true for `/`, but
  `/calceternal` and `/calcevoker` now have their own static cards. The 1.2.8 `afterEach` hook is still
  useful (in-app tab title, client-side navigation, Googlebot) and is unchanged.
- **Only the three real routes are pre-rendered.** NotFound is intentionally left to the `404.html`
  path; there is no static file for arbitrary unknown URLs.
- `og-preview.png` is hand-authored art, not a game asset; `check-item-images.js` is unaffected
  (it only walks `supplies.js` items in `public/img/item/`).
- `package.json` version stays the single source of truth (§8 versioning policy).

### 13.4 Open question

- **Version number** — proposed **1.2.9** (staying in the 1.2.x SEO line). Could be **1.3.0** since it
  introduces build-time pre-rendering as a new build stage. Defaulting to 1.2.9 unless changed.

### 13.5 Acceptance criteria

1. After `npm run build`, `dist/calceternal/index.html` and `dist/calcevoker/index.html` exist, each
   with its own `<title>`, `og:title`, `og:description`, and `og:url` (the route's absolute production URL).
2. Pasting `https://rene880.github.io/raziel-ledger/calceternal` (and `…/calcevoker`) into a link-preview
   validator (opengraph.xyz / Facebook Sharing Debugger) renders a card with the page-specific title and
   description; the root `/` card is unchanged.
3. Loading both deep links in `npm run preview` hydrates the SPA and routes to the correct calculator with
   the clean URL (no `?/` redirect needed for these two paths).
4. `npm test` still passes (316 item icons; pre-rendered HTML not in scope of the check).
5. `package.json` `version` is `1.2.9`; `CLAUDE.md` and `README.md` reflect v1.2.9.

---

## 14. Version 1.2.10 — Self-hosted subsetted homepage font (2026-06-14)

### 14.1 Problem

The homepage hero ("Raziel Ledger" in Great Vibes, `Home.vue`) loaded the font from Google Fonts via
a render-blocking cross-origin chain in `index.html`:

```
HTML → fonts.googleapis.com/css2 (~151 ms) → fonts.gstatic.com woff2 (~1,296 ms, 29.70 KiB)
```

The ~1.3 s is dominated by a **second** origin's DNS + TLS handshake, not transfer — and the full Latin
charset is shipped when the hero needs only **11 glyphs** (`R a z i e l L d g r` + space). Great Vibes
is used nowhere else at runtime (the standalone `raziel-ledger-lettering.svg` isn't loaded by the app,
and `og-preview.png` is a pre-rendered PNG).

### 14.2 Scope

| # | Change |
|---|--------|
| S1 | Add `public/fonts/great-vibes-subset.woff2` — Great Vibes (OFL) subset to the 11 hero glyphs (~6 KB, down from 29.70 KiB). Obtained from the Google Fonts `&text=Raziel Ledger` endpoint (which emits an optimal subset woff2). Not a game asset — outside `check-item-images.js`. |
| S2 | In `index.html`, replace the two `preconnect`s + the css2 `<link rel="stylesheet">` with a same-origin `@font-face` (inline `<style>`, `font-display: swap`) and a `<link rel="preload" as="font" type="font/woff2" crossorigin>`, both pointing at `%BASE_URL%fonts/great-vibes-subset.woff2` (Vite substitutes the `/raziel-ledger/` base; needed because Vite does not rewrite `url()` inside inline `<style>`). `crossorigin` is required on the preload to match the font's CORS fetch mode (else it double-downloads). |
| S3 | In `scripts/prerender-routes.js`, strip the font `preload` from the calc-route pre-renders (the hero font isn't used on `/calceternal` or `/calcevoker`) so they don't fetch an unused font or emit a "preloaded but not used" console warning. The inert `@font-face` is left in place (it only downloads when a matching glyph renders). |
| S4 | Bump `package.json` `version` to **1.2.10**; sync `CLAUDE.md` and `README.md`. |

### 14.3 Notes & constraints

- **No Google Fonts request at runtime.** The font is served same-origin from GitHub Pages, on the
  connection already opened for the HTML — eliminating the cross-origin DNS/TLS chain that cost the ~1.3 s.
- **OFL licensing.** Great Vibes is SIL Open Font License; self-hosting/subsetting is permitted. Keep
  attribution.
- `Home.vue`'s inline `font-family: 'Great Vibes', …` is unchanged — it now resolves against the
  self-hosted `@font-face` instead of the Google stylesheet.
- The standalone `public/img/raziel-ledger-lettering.svg` still carries its own (now unused) Google
  Fonts `@import`; it is not loaded by the app and is left as-is.
- `og-preview.png` and the lettering SVG remain hand-authored, not game assets, and outside
  `check-item-images.js` scope.

### 14.4 Acceptance criteria

1. `public/fonts/great-vibes-subset.woff2` exists (~6 KB, valid WOFF2) and deploys to
   `https://rene880.github.io/raziel-ledger/fonts/great-vibes-subset.woff2`.
2. `index.html` contains no `fonts.googleapis.com` / `fonts.gstatic.com` references; the hero renders in
   Great Vibes from the self-hosted font with no Google network request.
3. After `npm run build`, `dist/index.html` preloads the font (preload + `@font-face`); the pre-rendered
   `dist/calceternal/index.html` and `dist/calcevoker/index.html` keep the `@font-face` but **not** the preload.
4. `npm test` still passes (316 item icons; the font is not in scope of the check).
5. `package.json` `version` is `1.2.10`; `CLAUDE.md` and `README.md` reflect v1.2.10.

---

## 15. Version 1.2.11 — Supplies import, per-unit "focus" & inventory UI (2026-06-21)

### 15.1 Problem / motivation

The calculators show *what a unit needs* but had no notion of *what the player owns*. Players track
their real Granblue stock elsewhere and mentally subtract it. Granblue's web client exposes the player's
full item inventory as a JSON response (the array shape in the git-ignored
`response-example/supplies-response.json`: `{ item_id, number, name, … }`, where `number` is the owned
count). We can ingest that and let the player **spend** it against a unit to see how far their stock gets
them — without changing the underlying calculator model (component state + `localStorage`, no backend, no
Vuex; §3, §6). Supporting UI rounds out the loop (S6–S9): a heads-up before the ★ overwrites tracked
quantities, a collapsible **Supplies** sidebar showing `remaining / owned` per item, and a navbar chip
naming the currently-focused unit.

### 15.2 Scope

| # | Change |
|---|--------|
| S1 | **Inventory store.** New `src/js/inventory.js` — a Vue `reactive` module store (no Vuex) holding the imported `stock` (`{ suppliesKey: count }`), the single active `focus`, and deferred-revert snapshots. Builds a one-time reverse `itemId → suppliesKey` map from `supplies.js`. Persisted under the **new** `App-inventory` `localStorage` key (joins the frozen `App-*` family; the existing `CalcEternal-*`/`CalcEvoker-*` progress keys are untouched). |
| S2 | **Import dialog.** New `src/components/SuppliesImport.vue` — a modal (paste textarea **and** `.json` file picker) opened from a new navbar **Import supplies** button (`faFileImport`) in `App.vue`. `inventory.importFromResponse(arr)` matches each `item_id` to a supplies `itemId`, replaces `stock`, and returns `{ total, matched, unmatched }` for a result line. **278** of the response entries map; the 30 weapon-namespace items (they carry *weapon* ids), `rupie`/`crystal`, and the evolution items (`goldbrick`/`sunlightstone`) have no item-path id and are skipped — an accepted limitation. |
| S3 | **Per-unit focus.** A ★ button (`faStar`) on each unit box in `Calculator.vue`. Clicking focuses that unit: for each material in the unit's selected `from→to` step range (resolved exactly as `getItemProgressFor` does — element/summon groups included), spend `min(owned, needed)` from `stock`, write it into that step's progress, and snapshot the consumed amounts + overwritten prior values. |
| S4 | **Global, single focus with reset-on-switch.** Only one unit across the whole app (both Eternal tabs + Evoker) is focused at a time. Switching focus (or re-clicking the star) first **resets** the previous unit — restores its prior progress and returns the spent stock — then applies to the new unit, so the same stock is never counted against two units (answers the "reset previous focus quantity" decision). |
| S5 | **Registration plumbing.** New `calcId` prop on `Calculator.vue` (`CalcEternal`, `CalcEternalRadiance`, `CalcEvoker`). Each page registers its loaded progress object with the store in `mounted()` (after `localStorage` load, so deferred reverts hit real data) and `unregister()`s in `beforeUnmount()`. A focus owned by an unmounted calc reverts its stock immediately and defers its progress restore until that calc next registers. New FA icons: `faStar`, `faFileImport`, `faXmark`. |
| S6 | **Focus/unfocus warning (dismissable).** A confirm dialog in `Calculator.vue` intercepts the ★ click: it explains that focusing fills the unit's quantities from stock and unfocusing restores them, and that hand edits made *while focused* are overwritten. A **"Don't show this again"** checkbox persists `warningDismissed` in the store; once set, the ★ acts immediately. Local `pendingFocusUnit`/`dontShowAgain` state; the star's handler is `requestFocus()` → `confirmFocus()`/`cancelFocus()`. |
| S7 | **Global inventory sidebar.** New `InventorySidebar.vue`, mounted in `App.vue` on every route, with an always-visible edge handle (`faWarehouse`) toggling a slide-in **Supplies** panel. Lists every owned item (`owned > 0`) as **`remaining / owned`** — `remaining` is the focus-decremented live stock, `owned` the imported baseline — sorted by category then name (mirroring `Calculator`'s `sortMaterials`), with item icon and gbf.wiki link; fully-spent rows dim. Empty state points at **Import supplies**. Open/closed persists under the new `App-sidebarOpen` key. |
| S8 | **Navbar focus chip.** The single active focus (★ + unit name) renders in the left nav group, **rightmost** (after the two calc links); hidden when nothing is focused. Clicking routes to the owning calculator via a `calcId → route` map — Eternal recruit/Radiance disambiguated by a `?tab=recruit\|radiance` query that `CalcEternal` reads on mount and watches. |
| S9 | **Store additions for S6–S8** (`src/js/inventory.js`): a new `owned` baseline (`{ key: count }`, set alongside `stock` on import, **not** decremented by focus); `name` snapshotted into `state.active` at focus time (so the chip has a label even when the owning calc is unmounted); a persisted `warningDismissed` flag; and `inventoryList()` (sorted sidebar rows) / `dismissWarning()`. Load is back-compatible — a persisted `App-inventory` without `owned` falls back to the current `stock` as the baseline. New FA icons `faWarehouse`, `faTriangleExclamation`. |
| S10 | Bump `package.json` `version` to **1.2.11**; sync `CLAUDE.md` and `README.md`. |
| S11 | **Tabbed inventory sidebar.** `InventorySidebar.vue` gains a tab bar under the "Supplies" header. First tab **Treasure** holds the imported supplies list. The structure is scaffolded to accept a future **Recovery** tab (a separate import targeting recovery items / `category_type`) — out of scope now, only the tab framework lands. Each tab carries its **own search box** (`searches[tabId]`, case-insensitive substring match on item name). |
| S12 | **3-column Treasure grid.** The Treasure tab renders items in a **3-wide grid** (`grid-cols-3`), one icon per cell. The item name moves into a hover **tooltip** (native `title`) instead of an inline label; the icon stays a gbf.wiki link (hover ring). The **`remaining / owned`** count sits **under** each icon. Fully-spent items still dim. Panel widens (`w-72 → w-80`) for the 3 columns. |
| S13 | **Import-order sort.** Items sort **left-to-right by their position in the imported JSON array** (the game's `seq_id` order), not by category/name. `inventory.js` captures an `order` index per key at import time (`state.order`, persisted in `App-inventory`); `inventoryList()` sorts by it, falling back to the old category→name sort for pre-amendment persisted inventories (back-compat load defaults `order` to `{}`). |
| S14 | **Import button label.** The navbar **Import supplies** control (`App.vue`) gains a visible `Import supplies` text label to the **left** of the `faFileImport` icon (the whole row stays one clickable target). |
| S15 | **Fixed sidebar height.** The Supplies panel is sized to the **viewport minus the navbar** — `h-[calc(100vh-5rem)]` (the panel is `fixed top-20` = `5rem`) — replacing the content-hugging `max-h-[70vh]`. It holds that height regardless of how many items are imported; the Treasure grid becomes the scroll region (`flex-1 min-h-0 overflow-y-auto`). |
| S16 | **Chest tab icon.** The Treasure tab icon changes from `faWarehouse` to a chest-style icon. FontAwesome **free** has no literal treasure chest (`faTreasureChest` is Pro), so `faBoxArchive` (`box-archive`) is used; registered in `main.js`. The sidebar edge handle keeps `faWarehouse`. |
| S17 | **Unfocus on delete.** Removing a unit box (the 🗑 button in `Calculator.vue`) that is the **active focus** now clears the focus first: new store method `inventory.unfocusIfActive(calcId, unitKey)` runs `clearActiveFocus()` (returns the spent stock to `state.stock`, drops `state.active`, persists) before `delete this.progress[unitKey]`. Previously a deleted focused unit left `state.active` dangling and its supplies permanently spent. The progress-restore half of `clearActiveFocus` is moot here (the unit is deleted next line), but returning the stock and clearing the focus are the point. |
| S18 | **Focus chip scrolls to the unit.** Clicking the navbar focus chip (S8) still routes to the owning calculator (and the correct Eternal tab) but now also **scrolls the focused unit box into view**. `Calculator.vue` gives each unit box a stable `id="focus-anchor-{calcId}-{unitKey}"` (`focusAnchorId()`) plus `scroll-mt-24`; `App.vue`'s `goToFocus()` resolves the same id and, after the route push settles, `scrollToAnchor()` polls (`$nextTick` + retry) until the element exists **and** is visible (`offsetParent !== null` — guards the Eternal `v-show` tab swap) then `scrollIntoView({ behavior: 'smooth', block: 'start' })`. |
| S19 | **Sidebar → side nav with an icon rail.** `InventorySidebar.vue` replaces the single edge toggle handle with an **always-visible vertical icon rail** at the right edge holding two clickable view icons — **`faWarehouse` → Treasure** and **`faFileImport` → Import supplies**. Clicking an icon opens the panel on that view; clicking the **active** icon (or the panel's `angle-right` header button) collapses back to the bare rail. The panel sits to the **left** of the rail; the panel header now shows the active view's label. Open/closed state still persists under the existing `App-sidebarOpen` key (`open` prop). The S16 `faBoxArchive` chest icon is dropped from the rail in favour of `faWarehouse` for the Treasure view (warehouse was previously only the edge handle). |
| S20 | **Import moves into the sidebar (inline, no modal).** The navbar **Import supplies** control and the modal `SuppliesImport.vue` dialog are removed from `App.vue`. `SuppliesImport.vue` is reduced to a **plain inline form** (the backdrop/header-X/Close-button/`close` emit are gone — file picker + paste textarea + Import button + result line remain, logic unchanged) and is rendered as the sidebar's **Import** view. The navbar's right group keeps only version / JST / theme controls. |

### 15.3 Notes & constraints

- **Reuses the existing progress model.** Focus writes into the same `progress[unit].materials[step][key]`
  counts the manual UI edits, so the merged/split views, hide-completed filter, and `localStorage`
  persistence all work unchanged; the page's deep `progress` watcher persists focus-applied values.
- **No new dependency, no backend, no Vuex.** The store is a `reactive` object persisted via
  `localStorage` like the rest of the app.
- **Reverse map is `itemId`-based.** Items whose `itemId` is a weapon id (the 30 weapons) or currency
  (`rupie`/`crystal`) or that are absent from the supplies dump won't auto-fill — see S2.
- `response-example/` stays git-ignored; the imported JSON never ships in the repo or build.
- `App-inventory` is a new key, not a rename — the frozen-keys constraint (§8.1) is preserved.
- **The S6–S8 UI is a layer over the focus store.** S6 only gates the existing `inventory.toggleFocus`
  behind a confirm; S7/S8 are read-only views of `state`. The reset-on-switch / deferred-revert logic is
  untouched. The new `App-sidebarOpen` key is UI-only and joins the frozen `App-*` family.
- **The sidebar shows raw `remaining / owned`** — it does not subtract pending needs. Items that never
  import (the 30 weapon items, currency, evolution items — S2) have no `owned` entry and simply don't
  appear, an accepted carry-over limitation.
- **S11–S13 (amendment, 2026-06-21, still v1.2.11).** The sidebar list became a tabbed, searchable
  3-column grid sorted by import order. Order comes from the user's own pasted array (same shape/order as
  the git-ignored `response-example/supplies-response.json`), so nothing new ships and no new store concept
  beyond the `order` map is introduced. No version bump — this refines S7's read-only view, the focus
  store/logic is untouched. The Recovery tab is scaffolded only (future import).
- **S14–S16 (amendment, 2026-06-21, still v1.2.11).** Cosmetic UI polish on the import control and Supplies
  panel: a text label on the import button, a fixed panel height (viewport − navbar, holds regardless of
  item count), and a chest-style (`faBoxArchive`) Treasure tab icon. No store/logic change, no version bump.
- **S17–S18 (amendment, 2026-06-21, still v1.2.11).** Focus lifecycle polish: deleting a focused unit now
  returns its stock and clears the focus (S17, the one genuine fix — previously it leaked spent supplies and
  a dangling `state.active`), and the navbar focus chip scrolls the focused unit into view after routing
  (S18). S17 reuses the existing `clearActiveFocus()`; S18 is a read-only navigation/scroll layer. No new
  store concept, no version bump.
- **S19–S20 (amendment, 2026-06-21, still v1.2.11).** The Supplies sidebar became a **side navigation bar**:
  an always-visible right-edge icon rail (`faWarehouse` → Treasure view, `faFileImport` → Import view) that
  expands the panel to the chosen view and collapses when the active icon is re-clicked, and **Import supplies
  moved inline into the sidebar** (the navbar control and the modal dialog are gone; `SuppliesImport.vue` is
  now an inline form embedded in the Import view). Pure UI re-housing — the inventory/focus store, the import
  logic, and the `App-sidebarOpen`/`App-inventory` keys are untouched. No version bump.

### 15.4 Acceptance criteria

1. The navbar **Import supplies** button opens a dialog; pasting (or loading) the
   `supplies-response.json` array imports the stock and reports matched/skipped counts (278 matched for
   the sample).
2. Clicking ★ on a unit fills that unit's progress from the imported stock (capped at each material's
   need, earliest step first) and the star shows as active.
3. Clicking ★ on a second unit (any calculator) un-fills the first and fills the second; the first unit's
   prior quantities and the total stock are restored exactly (no double-spend). Re-clicking the active ★
   clears the focus and restores that unit.
4. Reloading the page preserves the imported stock and the active focus (the ★ stays lit; revert still works).
5. Clicking ★ (when the warning has not been dismissed) opens a confirm dialog; **Continue** applies the
   focus/unfocus, **Cancel** leaves state unchanged. Ticking **Don't show this again** then continuing
   suppresses the dialog for all later ★ clicks (persists across reload).
6. The right-edge handle opens a **Supplies** panel listing imported items as `remaining / owned`, sorted
   by category then name; focusing a unit lowers the `remaining` of the spent items live; the open/closed
   state survives reload.
7. With a unit focused, a chip (★ + unit name) shows rightmost in the left nav group; clicking it routes
   to that unit's calculator (and the correct Eternal tab); the chip disappears when focus is cleared.
8. `npm test` still passes (316 item icons; the store/dialog/sidebar are not in scope of the check).
9. `package.json` `version` is `1.2.11`; `CLAUDE.md` and `README.md` reflect v1.2.11.
10. (S11–S13) The Supplies panel shows a **Treasure** tab with a search box and a 3-column icon grid;
    each cell shows `remaining / owned` under the icon, the name as a hover tooltip, and links to gbf.wiki.
    Items are ordered left-to-right by their position in the imported JSON (game seq order). Typing in the
    search box filters the grid by name; clearing it restores the full ordered list.
11. (S17) Deleting the currently-focused unit (🗑) returns its spent supplies to the Supplies panel
    (`remaining` goes back up) and clears the focus chip; no stock is leaked and no dangling focus remains.
12. (S18) Clicking the navbar focus chip routes to the owning calculator (correct Eternal tab) **and**
    scrolls the focused unit box into view, including when starting from another page or the other tab.
