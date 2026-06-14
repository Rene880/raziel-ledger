# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Prompt Instruction
Make you a sharp thinking partner, not a yes-machine. Cover:

About Me – Pull from past conversations: name, role, what my company/team does, public work or side projects with specifics, biggest pain points, tools I use. Missing something? Ask – don't guess.

Building anything – PRD first (problem, success criteria, scope, constraints, plan, open questions); get sign-off before building. Check what already exists before proposing custom work.

Pushback – Interrogate vague requests. Disagree when something's off. Flag contradictions before acting – never silently overwrite. No sycophancy.

Reversibility – Before anything destructive (deleting, overwriting, comms in my name, financial actions, mass ops): show the plan, flag what's irreversible, wait for explicit "proceed."

Note-taking – Capture context, decisions, and open threads continuously. Checkpoint before switching domains or when a chat runs long.

Working style – Show reasoning, not just conclusions. Breadth and rigor. Skip filler. If I say "things changed," re-interview me. Show me the draft, then we'll revise.

Whenever changes are made to supplies.js or supplies.images, you should also keep "About items.md" updated by following this table format order: id, type, name
Always refer to PRD.md and propose the changes on PRD.md first. Always keep latest 3 PRD version but condense the rest.

Whenever changes are made, make sure it is also reflected in CLAUDE.md and README.md

On every release (any new `## Version x.y.z` section in PRD.md), bump `package.json`'s `version` field to the same `x.y.z` in the same change set. `package.json` `version` is the single source of truth for the app version and must stay in sync with the PRD release heading.

## Project overview

Raziel Ledger is a Vue 3 + Vite SPA hosting two Granblue Fantasy material calculators
(`/calceternal`, `/calcevoker`), deployed to GitHub Pages. It is a rewrite of the calculators from
[Minimalist3/GranblueParty](https://github.com/Minimalist3/GranblueParty) (GPL-3.0) — keep attribution
intact. There is no backend, no authentication, and no Vuex; all state lives in component data and
`localStorage`. See `PRD.md` (repo root) for the full requirements.

A previous Vue 3 + TypeScript app exists in git history (initial commit `e5fbb52`, removed in
`c05488c`) — treat it as abandoned; do not restore or reference it.

## Commands

- `npm run dev` — local dev server
- `npm run test` — runs `scripts/check-item-images.js`: fails if any `supplies.js` item lacks its
  icon in `public/img/item/<key>.<jpg|gif>` (since v1.2.3, PRD §8 changelog). There are no other tests or linters.
- `npm run build` — runs the image check first (`prebuild`), then production build into `dist/`, then a
  `postbuild` pre-render (since v1.2.9). Since v1.2.6 the GitHub Pages SPA deep-link fallback is a dedicated
  rafgraph `public/404.html` redirect that Vite copies to `dist/404.html` (pre-1.2.6 the build `cp`-ed
  `index.html`; PRD §11 S5). A missing item icon fails the build. `postbuild` runs
  `scripts/prerender-routes.js`, which clones `dist/index.html` into `dist/calceternal/index.html` and
  `dist/calcevoker/index.html` with each route's static `<title>`/canonical/`og:`/`twitter:` tags so non-JS
  link scrapers get a per-page card (OG image stays sitewide; PRD §13).
- `npm run preview` — serve the production build locally
- A committed `.githooks/pre-commit` runs `npm test` on every commit (since v1.2.3, PRD §8 changelog);
  it is wired by the `prepare` script (`git config core.hooksPath .githooks`) on `npm install`.
  Bypassable with `git commit --no-verify` — `prebuild`/CI is the hard gate.

## Architecture

- `src/router/index.js` — vue-router (`createWebHistory(import.meta.env.BASE_URL)`). Each route's
  `meta: { title, description }` is pulled (by path) from the shared `src/seo/meta.js` `ROUTES` table; a
  `router.afterEach` hook (since v1.2.8) sets `document.title` and updates the in-document
  `<meta name="title|description">`, `<link rel="canonical">`, and `og:`/`twitter:` title/description/url per
  route — JS-rendered, so it serves the browser tab + Googlebot, while the static `index.html` tags stay the
  defaults that no-JS link scrapers read. No head library; the hook mutates existing DOM tags. `public/sitemap.xml`
  (v1.2.8) lists the three routes for manual GSC submission. See PRD §12.
- `src/seo/meta.js` (since v1.2.9) — dependency-free single source of truth for route SEO: `SITE_ORIGIN`,
  `SITE_NAME`, defaults, `OG_IMAGE`, the `ROUTES` table (`{ path, title, description, prerender }`), and
  `urlForPath()`. Imported by both `src/router/index.js` (runtime hook) and `scripts/prerender-routes.js`
  (build-time pre-render) so the two can't drift. See PRD §13.
- `src/pages/` — `Home`, `CalcEternal`, `CalcEvoker`, `NotFound`. The two calc pages own the progress
  state, persist it to `localStorage` (keys `CalcEternal-*` / `CalcEvoker-*` via `js/utils.js`
  `LocalStorageMgt`), and delegate all logic to `components/Calculator.vue`. `CalcEternal` has two
  tabs (since v1.2, PRD §9): "Recruit & Transcend" and "Radiance", each rendered by its own
  `Calculator` instance — recruit/transcend uses `ETERNALS_DATA.materials` (key `CalcEternal-progress`),
  Radiance uses `ETERNALS_DATA.radiance` (key `CalcEternal-radianceProgress`); the split/hide/display
  toggles are shared, the active tab persists under `CalcEternal-activeTab`.
- `src/components/Calculator.vue` — generic step/material calculator driven by the data shape in
  `src/js/supplies-{eternals,evokers}.js`. Material "groups" resolve to concrete items per unit
  element/id using `src/js/supplies.js`.
- `src/js/supplies*.js` — frozen game data from GranblueParty, trimmed in v1.1 to the items and
  groups the calculators reference (the unused `rustedweapon` item is a deliberate keep — see PRD
  §8), then extended in v1.2 with the Radiance materials (`ETERNALS_DATA.radiance`, plus the
  `enneadomegaanima` / `omega3omegaanima` groups and their items, `immortalfragment`, `terraadamant` —
  PRD §8 changelog), and in v1.2.4 each item carries an optional `itemId` (its GBF in-game id, from
  the API dumps in the git-ignored `response-example/`); the 30 weapon-namespace items (rusted /
  silver relic / revenant) carry their weapon id instead (resolved on the CDN weapon path, not
  `item/article/s/`), and only the 4 animated `.gif` items have none (PRD §9). `public/img/item/` is
  one image per item. WikiParser (since v1.2.5) is a standalone item-image fetcher: `update_img.py`
  reads a `URL⇥dest` manifest and downloads icons into `public/img/item/` (skips existing files).
  `WikiParser/data/supplies.images`
  is the manifest for every static (`.jpg`) item — since v1.2.4 the 282 items with an `itemId` point
  at the official CDN (`prd-game-a-granbluefantasy.akamaized.net/.../item/article/s/<itemId>.jpg`, with
  exceptions: `item/normal/s/` for `rupie`/`crystal`, and `item/evolution/s/` for `goldbrick`/`sunlightstone`). All 30 weapons carry their weapon id as `itemId`, on the
  CDN's weapon path (`.../assets/weapon/s/<itemId>.jpg` — rusted `1030…`, silver relics +
  revenant `1040…`; extracted from the manifest's weapon URLs); the 4 animated (`.gif`) items are
  excluded (different source). Full id reference: `About items.md`. `scripts/check-item-images.js`
  (npm `test` / `prebuild`) asserts every `supplies.js` item has its `public/img/item/<key>.<jpg|gif>`.
  WikiParser is GPL-3.0, not part of the web build; in v1.2.5 it was reduced to just the fetcher
  (`update_img.py` + `data/supplies.images` + `requirements.txt`) — the upstream DB/preview/wiki-scrape
  pipeline was deleted. Run it with `cd WikiParser && python3 update_img.py`. See PRD §10.
- Components use the Options API, mirroring the upstream project; keep that style for consistency.
- The Vite/router base is `/raziel-ledger/` (`vite.config.js`); asset URLs in code must be prefixed
  with `import.meta.env.BASE_URL` (item images live in `public/img/item/`).
- Theming: three CSS-variable themes (`theme-dark`/`theme-blue`/`theme-light`) in `src/css/theme.css`,
  consumed by Tailwind config colors (`bg-primary`, `text-primary`, etc.).
- `public/img/raziel-ledger-lettering.svg` — hand-authored calligraphy SVG (Great Vibes font, `fill: currentColor`);
  inlined in `Home.vue` with `class="text-primary"` so it inherits `--color-text-primary` and responds to all three
  themes. Google Fonts (Great Vibes) is loaded globally in `index.html` (not in the SVG `@import`, which would be
  blocked when the SVG is loaded as `<img>`). This file is **not** a game asset — never overwrite with `download()`.
  See PRD §9.
- SEO / social previews (since v1.2.5… v1.2.6, PRD §11): `index.html` carries **static** `<head>` tags —
  `<link rel="canonical">`, Open Graph (`og:*`), and Twitter Card (`summary_large_image`) — all hardcoding the
  absolute production URL `https://rene880.github.io/raziel-ledger/` (scrapers don't run JS, and a subpath base
  makes relative OG URLs unreliable). The link-preview image is `public/img/og-preview.png` (1200×630, "Raziel
  Ledger" in Great Vibes on the dark theme bg) — like the lettering SVG it is hand-authored, **not** a game asset,
  and is not covered by `check-item-images.js`. No SSR. Since v1.2.8 there **is** runtime per-route meta (the
  `src/router/index.js` `afterEach` hook, above) layered over these static defaults, and a `public/sitemap.xml`
  for **manual** GSC submission (PRD §12). Since v1.2.9 the static `index.html` defaults are no longer the only
  per-route signal scrapers see: the `postbuild` `scripts/prerender-routes.js` emits `dist/calceternal/index.html`
  and `dist/calcevoker/index.html` with their own static `<title>`/canonical/`og:`/`twitter:` tags (OG image stays
  the sitewide `og-preview.png`), so those deep routes serve a real 200 file with a per-page card instead of
  falling through to `404.html` (PRD §13). `robots.txt` is still intentionally absent: a `public/robots.txt`
  would deploy to `/raziel-ledger/robots.txt`, which crawlers ignore (they read
  `https://rene880.github.io/robots.txt`, owned by the separate user-page repo); the same non-discovery applies
  to the subpath sitemap, which is why it's submitted directly in Search Console rather than auto-found.

## Deployment

Push to `main` runs `.github/workflows/deploy.yml` (build + `actions/deploy-pages`). Repository
setting **Pages → Source** must be **GitHub Actions**.
