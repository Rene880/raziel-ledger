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

---

## 9. Version 1.2 — Eternals Radiance tab (signed off 2026-06-12)

### 9.1 Problem

The Eternals page covers recruit → uncap → 6★ transcendence, but not the newest progression,
[Radiance of the Eternal](https://gbf.wiki/Radiance_of_the_Eternal) (Radiance levels 1–5), which an
Eternal unlocks after reaching transcendence level 110. Players want to plan those materials in the
same tool.

### 9.2 Scope

| # | Change |
|---|--------|
| R1 | Add a **`radiance`** material array to `ETERNALS_DATA` in `supplies-eternals.js` (5 steps, "Radiance Level 1"–"5"), as a sibling of `materials` — it does not alter the existing recruit/transcend data. |
| R2 | Add the materials Radiance introduces to `supplies.js`: 14 new items + 2 element groups (`enneadomegaanima`, `omega3omegaanima`); see 9.4. Everything else Radiance needs already exists and is reused. |
| R3 | Add a **tab switcher** to `CalcEternal.vue` ("Recruit & Transcend" / "Radiance"). The Radiance tab renders a **second `<calculator>` instance** bound to `{units, materials: radiance}`. `Calculator.vue` is generic and is **not** modified. |
| R4 | The Radiance tab keeps its own progress object, persisted to `localStorage` under **`CalcEternal-radianceProgress`**; the existing `CalcEternal-progress` (recruit/transcend) is untouched, so current users lose nothing. Active tab persists under `CalcEternal-activeTab`. The `splitMats` / `hideCompletedMats` / `displayList` UI toggles are shared across both tabs. |
| R5 | Download the 14 new item icons into `public/img/item/<itemKey>.jpg` (see 9.5). |
| R6 | Docs sync: reflect R1–R5 in `CLAUDE.md` and `README.md`. |

### 9.3 Radiance steps (materials per level)

Required materials scale with the Eternal's element/weapon type, resolved through groups exactly as
elsewhere. Source: the Radiance of the Eternal wiki page.

- **Lvl 1:** Genesis Fragment ×100, Omega II Omega Anima ×50 (`omega2omegaanima`), Ennead Omega Anima ×40 (`enneadomegaanima`), Trial Fragment ×50 (`trialfragment`), Champion Merit ×50.
- **Lvl 2:** Immortal Fragment ×70, Omega III Omega Anima ×25 (`omega3omegaanima`), Urn ×150 (`urns`), Elemental Halo ×15 (`halos`), True Dragon's Golden Scale ×30, Supreme Merit ×25.
- **Lvl 3:** Six-Dragon Advent Unique Item ×30 (`sixdragon`), Six-Dragon Jewel ×100 (`sixdragonjewel`), Silver Relic Shard ×60 (`silvershards`), Luster ×20 (`luster`), Legendary Merit ×10.
- **Lvl 4:** Revenant Weapon Fragment ×20 (`wfragment`), Weapon Stone ×500 (`weaponstones`), Quartz ×500 (`quartz`), Damascus Crystal ×10.
- **Lvl 5:** Terra Adamant ×1.

### 9.4 New data in `supplies.js`

- **Items (standalone):** `immortalfragment` (Immortal Fragment), `terraadamant` (Terra Adamant).
- **Group `enneadomegaanima`** (element): `fireenneadomegaanima` Atum / `waterenneadomegaanima` Tefnut / `earthenneadomegaanima` Bennu / `windenneadomegaanima` Ra / `lightenneadomegaanima` Horus / `darkenneadomegaanima` Osiris.
- **Group `omega3omegaanima`** (element): `fireomega3omegaanima` Ira / `wateromega3omegaanima` Mare / `earthomega3omegaanima` Arbos / `windomega3omegaanima` Aura / `lightomega3omegaanima` Credo / `darkomega3omegaanima` Ater — all `Categories.anima`.

Element assignment is **positional** (1st item = fire … 6th = dark), matching the order in the wiki
material list and the existing `omega2omegaanima` convention (Shiva=fire … Avatar=dark).

### 9.5 Image acquisition (constraint)

WikiParser has **no item/material image code path** — `parse.py` only emits `.images` for
characters, summons, and weapons, so the documented pipeline (even with PostgreSQL) cannot produce
these material icons. Instead, the 14 icons are fetched from gbf.wiki via
`https://gbf.wiki/Special:Redirect/file/<Name>_square.jpg` (the same source the existing icons came
from — verified by the `File source:` comment embedded in `fireomega2omegaanima.jpg`), driven through
WikiParser's own `download()` ([update_img.py](WikiParser/update_img.py)) using a hand-authored
`WikiParser/data/radiance.images` (native `URL⇥dest` format). This keeps the new icons consistent
with the §8 sweep rule (one `<itemKey>.jpg` per item).

### 9.6 Acceptance criteria

1. `/calceternal` shows two tabs; "Radiance" renders the 5 Radiance levels with correct
   element/summon-resolved materials and no broken images.
2. Editing quantities on either tab, switching tabs, and reloading restores both tabs' state
   independently from `localStorage`.
3. The recruit/transcend tab is byte-for-byte behavior-identical to v1.1 (its data and
   `CalcEternal-progress` key are untouched).
4. Every new item key has its `public/img/item/<key>.jpg`; reference walk reports 0 dangling
   references.
5. `npm run build` passes; CLAUDE.md and README.md reflect v1.2.

## 10. Version 1.2.1 — Footer & navigation polish (2026-06-14)

### 10.1 Scope

| # | Change |
|---|--------|
| P1 | Footer (`App.vue`): replace the `granblue.party` link with a **gbf.wiki** link (`https://gbf.wiki`). The "Based on Minimalist3/GranblueParty (GPL-3.0)" attribution link is **kept** (GPL-3.0 requirement). |
| P2 | Home page (`Home.vue`): add an item icon to each calculator card — `goldbrick.jpg` for the **Eternals** card, `newworldquartz.jpg` for the **Evokers** card (both already in `public/img/item/`, referenced via `import.meta.env.BASE_URL`). |
| P3 | `/calceternal` wiki reference list: add a link to [Radiance of the Eternal](https://gbf.wiki/Radiance_of_the_Eternal), alongside the existing recruit/uncap/transcend links. |
| P4 | Home page (`Home.vue`): update the Eternals card description to "Recruit, uncap, radiance, and transcend the Eternals using the \"40 boxes\" method." |
| P5 | Bump `package.json` `version` to **`1.2.1`** (it had been left at `1.0.0` through v1.1/v1.2). From now on, `package.json` `version` is kept in sync with the PRD release version on every release — see the versioning policy below. |
| P6 | Docs sync: reflect P1–P5 in `CLAUDE.md` and `README.md`. |

No data, calculator logic, or `localStorage` keys change.

### 10.2 Versioning policy

Every release (any new `## N. Version x.y.z` section in this PRD) must bump `package.json`'s
`version` field to the same `x.y.z` in the same change set. This is now the single source of truth
for the app version; keep it in sync with the PRD release heading and the matching `CLAUDE.md` /
`README.md` notes.

## 11. Version 1.2.2 — Radiance "Reduce Revenant Weapon" correction (2026-06-14)

### 11.1 Problem

The Radiance tab's reduce step (`ETERNALS_DATA.radiance`, step 4 in `supplies-eternals.js`) was
labelled "Reduce 10 Revenant Weapon" and carried the 10-weapon material cost copied from the
recruit/transcend tab. The Radiance step only requires **4** Revenant Weapons, so both the label
and the quantities were wrong.

### 11.2 Scope

| # | Change |
|---|--------|
| P1 | Rename the Radiance step from "Reduce 10 Revenant Weapon" to "Reduce 4 Revenant Weapon". |
| P2 | Scale every quantity in that step from the 10-weapon cost to the 4-weapon cost (divide by 10, multiply by 4 → ×0.4): orblight/scrolllight/whorllight/whitedragonscale/championmerit 500→200, crystal 1000→400, revenantw 40→16, flawedprism 2500→1000, trueanima 30→12, rustedw 40→16, whorl 2500→1000, loworb 2500→1000. |
| P3 | Bump `package.json` `version` to **`1.2.2`**; sync `CLAUDE.md` and `README.md`. |

Only the Radiance reduce step changes. The recruit/transcend "Reduce 10 Revenant Weapons" steps and
all `localStorage` keys are untouched.

## 12. Version 1.2.3 — Item-image manifest & existence check (2026-06-14)

### 12.1 Problem

Item icons in `public/img/item/` are matched to `supplies.js` item keys only at runtime — a missing
or mis-named icon renders a broken image with no build-time warning (the historical
`silvershardmelee` → `silvershardgauntlet` bug in §8 shipped this way). There is also no single
manifest of every item's icon source; only the 14 v1.2 Radiance icons had one
(`WikiParser/data/radiance.images`).

### 12.2 Scope

| # | Change |
|---|--------|
| M1 | Add `WikiParser/data/supplies.images`: a native `URL⇥dest` manifest for every **static** (`.jpg`) item in `supplies.js` (312 lines), in file order, URLs derived by the §9.5 / `download-images` convention (`https://gbf.wiki/Special:Redirect/file/<Display_Name>_square.jpg`; spaces→`_`, `'`→`%27`, `,`→`%2C`). Fold `radiance.images` into it and delete `radiance.images` — its 14 entries are an exact subset. |
| M2 | The 4 **animated** (`.gif`) items (`loworb`, `trueanima`, `whorl`, `rustedweapon`) are excluded from the manifest: gif icons come from a different source (`download-images` skill), and `download()` parses every line as `URL⇥dest`, so it cannot carry comment/blank lines. |
| M3 | Add `scripts/check-item-images.js`: imports `supplies.js` and fails (exit 1) if any item lacks `public/img/item/<key>.<jpg\|gif>` (ext from the `animated` flag), naming each missing key/file and how to add it. Covers all **316** items. |
| M4 | Wire the check as npm `test` and `prebuild` so `npm run build` fails on a missing icon. Bump `package.json` `version` to **1.2.3**; sync `CLAUDE.md` and `README.md`. |
| M5 | Add a committed `.githooks/pre-commit` that runs `npm test`, activated via a `prepare` npm script (`git config core.hooksPath .githooks`, guarded with `|| true` for non-git installs). Convenience guard only — bypassable with `--no-verify`; `prebuild`/CI stays the hard gate. |

### 12.3 Notes & constraints

- Manifest URLs are **unverified against the live wiki** — all 312 targets already exist locally, so
  WikiParser's `download()` is a no-op today (it skips existing files). A future 404 on re-run means
  that item's wiki file name needs manual correction (same caveat as the `download-images` skill).
- `download()` is still invoked per-manifest (never `update_img.main()`), preserving the §9.5 / skill
  scope guarantee that unrelated summon/chara/weapon art is untouched.
- WikiParser `.py` files are not modified (G4). No app code, calculator data, or `localStorage` keys
  change.

### 12.4 Acceptance criteria

1. `WikiParser/data/supplies.images` has one `URL⇥<key>.jpg` line per static item (312); every former
   `radiance.images` line is present; `radiance.images` is removed.
2. `npm test` passes on a clean tree (`✓ All 316 item icons present`) and exits non-zero, naming the
   offending key/file, when an icon is missing.
3. `npm run build` fails (via `prebuild`) when an item icon is missing.
4. After `npm install`, `git config core.hooksPath` is `.githooks`, and committing with a missing
   icon is blocked by the pre-commit hook (unless `--no-verify`).
5. `package.json` `version` is `1.2.3`; CLAUDE.md and README.md reflect v1.2.3.
