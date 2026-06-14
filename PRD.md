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

### 11.1 Problem
`index.html` carries only `<title>` + `<meta name="description">`. The app is a client-side-rendered
SPA, so two SEO gaps follow:

- **Link previews are blank/ugly.** Social scrapers (Facebook, Twitter/X, Discord, Slack, iMessage)
  do **not** execute JavaScript — they read only the static `index.html`. With no Open Graph / Twitter
  Card tags and no preview image, shared links unfurl with no card.
- **No canonical / absolute self-reference**, so the indexed URL is ambiguous.

Googlebot *does* render JS, so the app itself can be crawled; this version targets the parts that
static HTML must supply. SSR and runtime per-route meta remain out of scope (§3).

### 11.2 Scope
| # | Change |
|---|--------|
| S1 | Add static `<head>` tags to `index.html`: `<link rel="canonical">`, Open Graph (`og:type=website`, `og:url`, `og:title`, `og:description`, `og:image` + `og:image:width/height`), and Twitter Card (`twitter:card=summary_large_image`, mirroring title/description/image). |
| S2 | All absolute URLs hardcode the production origin `https://rene880.github.io/raziel-ledger/` (the Vite base is a subpath, so relative OG URLs are unreliable for scrapers). |
| S3 | Add `public/img/og-preview.png` — a `1200×630` link-preview image (image source TBD, see §11.4 open question). Referenced by `og:image` / `twitter:image` at its absolute CDN-of-record URL `…/raziel-ledger/img/og-preview.png`. |
| S4 | Bump `package.json` `version` to **1.2.6**; sync `CLAUDE.md` and `README.md`. |
| S5 | **Deep-link 404-status fix (rafgraph SPA redirect).** Replace the `cp dist/index.html dist/404.html` build step with a dedicated `public/404.html` (auto-copied by Vite) that client-side-redirects an unknown path to `…/raziel-ledger/?/<path>` (rafgraph technique, `pathSegmentsToKeep = 1`), and add the matching decode snippet to `index.html`'s `<head>` that rewrites that query back to the real path via `history.replaceState` before the router boots. Deep links (`/calceternal`, `/calcevoker`) now resolve to a **200** home document instead of being served from the 404 document. |

### 11.3 Notes & constraints
- **Out of scope on purpose:** `robots.txt` and `sitemap.xml`. A file placed in `public/` deploys to
  `/raziel-ledger/robots.txt`, which crawlers do **not** fetch (the spec only honors
  `https://rene880.github.io/robots.txt`, owned by the separate `rene880.github.io` user-page repo).
  A sitemap can still be submitted manually via Google Search Console if desired later.
- **Deep-link status (addressed by S5):** previously the deploy copied `dist/index.html` →
  `dist/404.html`, so deep links rendered the app but were served from the **404** document. S5 replaces
  that with the rafgraph SPA redirect: a hit to `/raziel-ledger/calceternal` still triggers GitHub's
  404 document, but that document immediately `location.replace`s to `/raziel-ledger/?/calceternal` — a
  **200** home document — and `index.html` rewrites the URL back to `/calceternal` before the router
  initializes. Honest caveat: this is a *client-side* redirect; the very first GitHub response for a
  non-existent path is still HTTP 404 (an unavoidable GitHub Pages limitation), but JS-rendering crawlers
  and all users land on a 200 page with the correct clean URL. The home page (`/`) was always 200.
- `og:image` must be a raster `PNG`/`JPG`; the existing `favicon.svg` / `raziel-ledger-lettering.svg`
  are **not** valid OG images (scrapers ignore SVG). `og-preview.png` is hand-authored/derived art, not
  a game asset — like `raziel-ledger-lettering.svg` it must never be overwritten by WikiParser `download()`.
- `check-item-images.js` is unaffected — it only walks `supplies.js` items in `public/img/item/`, not
  `public/img/og-preview.png`.

### 11.4 Resolved decision
- **OG preview image source** — option (a): the "Raziel Ledger" lettering in **Great Vibes** over the
  `theme-dark` background (`#18181b` zinc-900 bg, `#f4f4f5` zinc-100 lettering), with a muted
  "Granblue Fantasy Calculators" subtitle, rendered to `1200×630` `public/img/og-preview.png`.
  Generated with PIL from the upstream Great Vibes TTF (the web font is not installed locally, so an
  SVG rasterizer would fall back to a generic serif — PIL draws from the real font file instead).

### 11.5 Acceptance criteria
1. `index.html` contains static `og:*` and `twitter:*` tags plus a `<link rel="canonical">`, all using
   the absolute production URL.
2. `public/img/og-preview.png` exists at `1200×630` and is reachable at
   `https://rene880.github.io/raziel-ledger/img/og-preview.png` after deploy.
3. Pasting the production URL into a link-preview validator (e.g. Facebook Sharing Debugger / opengraph.xyz)
   renders a card with the title, description, and image.
4. `npm test` still passes (316 item icons; og-preview not in scope of the check).
5. `package.json` `version` is `1.2.6`; `CLAUDE.md` and `README.md` reflect v1.2.6.
6. `npm run build` emits a rafgraph `dist/404.html` (redirect script, not a copy of the app) and an
   `index.html` carrying the decode snippet; loading `/raziel-ledger/calceternal` in `npm run preview`
   resolves to the calculator with the URL normalized to `/raziel-ledger/calceternal` (no `?/` left behind).

---

## 12. Version 1.2.8 — Per-route titles/meta + sitemap (2026-06-14)

### 12.1 Problem

After 1.2.6 the app still served **one** `<title>` and `<meta description>` for every route: Home,
the Eternals calculator, and the Evokers calculator all indexed under the same generic title. The site
was also **not yet indexed** at all (confirmed via a `site:rene880.github.io/raziel-ledger` search
returning no results) — a new GitHub Pages project site with no inbound links and no sitemap had never
been discovered. 1.2.6 deliberately shipped **no sitemap** on the reasoning that a project-subpath file
isn't auto-discovered; but a sitemap can still be **submitted directly** in Google Search Console, which
is the single most actionable nudge for a brand-new site. Both gaps are addressed here. SSR remains out
of scope (§3) — this is runtime/JS meta, which Googlebot renders, layered over the static scraper tags.

### 12.2 Scope

| # | Change |
|---|--------|
| M1 | Give each route in `src/router/index.js` a `meta: { title, description }`: Home (`Raziel Ledger - Granblue Fantasy Calculators`), `/calceternal` (`Eternals Calculator - Raziel Ledger`), `/calcevoker` (`Evokers Calculator - Raziel Ledger`), NotFound (`Page Not Found - Raziel Ledger`). |
| M2 | Add a `router.afterEach((to) => …)` hook that, from `to.meta`, sets `document.title` and updates the existing in-document `<meta name="title">`, `<meta name="description">`, `<link rel="canonical">`, `og:title/description/url/image`, and `twitter:title/description/image`. The canonical/og `url` is the absolute production URL for the route (`https://rene880.github.io/raziel-ledger` + path). Missing tags are skipped (no crash if `index.html` drops one). |
| M2b | **Replace the per-page `setHead()` mechanism** with this single hook: removed the `mounted()` `setHead({title, desc})` calls from all four pages (`Home`, `CalcEternal`, `CalcEvoker`, `NotFound`) and deleted `src/js/head.js`. Previously `mounted()` ran *after* `afterEach`, so `setHead` silently overrode the route-meta title (e.g. tab read "Raziel Ledger - Eternal Calculator" while `og:title` read "Eternals Calculator - Raziel Ledger"); the hook is now the single source of truth and the calc-page titles match their meta titles. |
| M3 | Add `public/sitemap.xml` listing the three real routes (`/`, `/calceternal`, `/calcevoker`) with absolute production `loc`s; Vite copies it to `dist/sitemap.xml` → reachable at `https://rene880.github.io/raziel-ledger/sitemap.xml`. Submitted manually in Search Console (not auto-discovered — the project subpath isn't honored by the root `robots.txt`). |
| M4 | Bump `package.json` `version` to **1.2.8**; sync `CLAUDE.md` and `README.md`. Removed a stray `</content>`/`</invoke>` artifact from §9 and condensed §9 to keep only the latest three releases (§10–§12) detailed. |

### 12.3 Notes & constraints

- **Static tags stay authoritative for scrapers.** Link-preview crawlers (Facebook/Discord/Slack/X)
  don't run JS, so they still read the 1.2.6 static `index.html` defaults (the Home values). The
  `afterEach` hook only benefits the browser tab title and JS-rendering crawlers (Googlebot). This is the
  same JS-vs-static split called out in §11 — not a regression of it.
- **Partially reverses 1.2.6's "no sitemap" decision (§11.3).** That note still holds for *auto-discovery*
  (a subpath `sitemap.xml`/`robots.txt` is not crawled unprompted); the sitemap here exists for **manual
  GSC submission**, which §11.3 already anticipated ("can still be submitted manually … if desired later").
- **No new dependency.** No `@vueuse/head`/`vue-meta`; the hook mutates pre-existing DOM tags directly, in
  keeping with the project's zero-runtime-meta-library stance.
- `sitemap.xml` is not a game asset and is outside `check-item-images.js` scope.

### 12.4 Acceptance criteria

1. Navigating to `/calceternal` and `/calcevoker` changes the browser tab title to the Eternals/Evokers
   title respectively; returning to `/` restores the Home title.
2. After navigation, `document.querySelector('link[rel="canonical"]').href` and `meta[property="og:url"]`
   reflect the current route's absolute production URL.
3. `public/sitemap.xml` is well-formed, lists the three production route URLs, and deploys to
   `https://rene880.github.io/raziel-ledger/sitemap.xml`.
4. `npm test` still passes (316 item icons; sitemap not in scope of the check).
5. `package.json` `version` is `1.2.8`; `CLAUDE.md` and `README.md` reflect v1.2.8.

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
