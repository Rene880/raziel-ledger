# Raziel Ledger

Material calculators for Granblue Fantasy long-term goals, served as a static SPA on GitHub Pages:

- **/calceternal** — materials to recruit, uncap (5★), and transcend (6★) an Eternal ("40 boxes" method), plus a **Radiance** tab for the Radiance of the Eternal levels 1–5
- **/calcevoker** — materials to obtain an Arcarum summon, recruit its Evoker, and uncap the New World Foundation weapon
- **/import-guide** — a desktop-only walkthrough of copying your in-game supplies JSON from the browser's DevTools so you can import it

All progress is stored in your browser's `localStorage`. There are no accounts and no backend.

Since v1.2.11 you can also **import your in-game supplies** (the Import view in the supplies side nav) and
**focus** a unit (the ★ button on each unit box) to spend that imported stock against the unit's
remaining materials, with a right-edge supplies side nav and a navbar focus chip — see
[Supplies import & focus](#supplies-import--focus). A **What's new** popup (the 📢 navbar control,
beside the version) summarizes the latest release and links the [import guide](#); the Import view links
it too.

## Attribution

This project is a Vue 3 + Vite rewrite of the calculators from
**[Minimalist3/GranblueParty](https://github.com/Minimalist3/GranblueParty)** (granblue.party) by Minimalist,
licensed under the [GPL-3.0](LICENSE). The calculator logic, game data, item images, and styling originate
from that project; the game data and item images are trimmed to the entries the two calculators use
(see PRD §8 for the details and exceptions). [WikiParser/](WikiParser/) is the standalone item-image fetcher
(`update_img.py` + `data/supplies.images`) that downloads the calculators' icons into `public/img/item/`;
since v1.2.5 it is reduced to just that (the upstream wiki-scrape/Postgres pipeline was removed — see PRD §10).

Granblue Fantasy content and materials are trademarks and copyrights of Cygames, Inc. or its licensors.

## Development

```sh
npm install
npm run dev      # local dev server
npm run test     # verify every supplies.js item has its icon in public/img/item/
npm run build    # static build in dist/ (runs the image check first, also creates the SPA 404.html fallback)
npm run preview  # preview the production build
```

`npm run test` (also run automatically before `npm run build`) checks that every item in
[src/js/supplies.js](src/js/supplies.js) has a matching icon in `public/img/item/<key>.<jpg|gif>` and
fails with the missing key/filename if not (see PRD §8 changelog). The icon download manifest lives at
[WikiParser/data/supplies.images](WikiParser/data/supplies.images); since v1.2.4 it sources each item's
icon from the official GBF CDN by the item's `itemId`; all 30 weapon-namespace items also use the
CDN's weapon path (ids in `About items.md`); only the 4 animated `.gif` icons remain
outside the CDN (see PRD §9). The homepage title is a hand-authored SVG (`public/img/raziel-ledger-lettering.svg`)
that uses `fill: currentColor` to adapt to the active theme (see PRD §10).

`npm install` also enables a `.githooks/pre-commit` hook (via the `prepare` script) that runs
`npm test` before each commit. It's a convenience guard — bypass with `git commit --no-verify`; the
real enforcement is `prebuild`/CI.

## Deployment

Pushing to `main` triggers [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the app
and publishes `dist/` to GitHub Pages. In the repository settings, set **Pages → Source** to **GitHub Actions**.

The app is built with base path `/raziel-ledger/` (see [vite.config.js](vite.config.js)); change it if the
repository is renamed or a custom domain is used. SPA deep links work through a dedicated rafgraph
[public/404.html](public/404.html) redirect (since v1.2.6): GitHub serves it for unknown paths, it
redirects to the app index (a 200 document) with the path encoded in the query string, and `index.html`
rewrites that back into the real route before the router boots. If you change the base path, update
`pathSegmentsToKeep` in `public/404.html` accordingly (it's `1` for a one-segment project-site base).

### SEO / social previews

`index.html` includes **static** social-preview meta — canonical URL, Open Graph, and a
`summary_large_image` Twitter Card — that hardcode the production URL
`https://rene880.github.io/raziel-ledger/` and a `1200×630` preview image at
[public/img/og-preview.png](public/img/og-preview.png). They're static (not Vue-injected) because link
scrapers don't run JavaScript. If you fork or rename the repo, update those absolute URLs to your own
Pages URL.

Since v1.2.8, [src/router/index.js](src/router/index.js) also sets **per-route** titles/meta at runtime:
a `router.afterEach` hook updates `document.title`, `description`, `canonical`, and the `og:`/`twitter:`
title/description/url from each route's `meta` (Home, Eternals, Evokers, NotFound). This is JS-rendered, so
it benefits the browser tab and JS-rendering crawlers (Googlebot); the static `index.html` tags stay the
defaults that no-JS link scrapers read. [public/sitemap.xml](public/sitemap.xml) lists the three routes and
deploys to `https://rene880.github.io/raziel-ledger/sitemap.xml` for **manual** submission in Google Search
Console. A `robots.txt` is still omitted: at a project subpath it isn't honored — crawlers only read
`https://<user>.github.io/robots.txt`, served from your user/org page repo. See PRD §11–§12.

Since v1.2.9, the deep routes get **static** per-page cards too, so link scrapers (which never run the
runtime hook) unfurl a correct card for `/calceternal` and `/calcevoker` — not just `/`. A `postbuild`
step, [scripts/prerender-routes.js](scripts/prerender-routes.js), clones the built `dist/index.html` into
`dist/calceternal/index.html` and `dist/calcevoker/index.html`, swapping in each route's `<title>` /
canonical / `og:` / `twitter:` title-description-url (the OG **image** stays the sitewide `og-preview.png`).
The route SEO table lives in [src/seo/meta.js](src/seo/meta.js), shared by both the router hook and the
pre-render script so they can't drift. These two routes now serve a real **200** file instead of falling
through to `404.html`; the rafgraph redirect remains for genuinely unknown paths. See PRD §13.

Since v1.2.10, the homepage hero font (Great Vibes) is **self-hosted** instead of fetched from Google
Fonts. [public/fonts/great-vibes-subset.woff2](public/fonts/great-vibes-subset.woff2) (~6 KB, OFL,
subset to the 11 glyphs in "Raziel Ledger") is declared in `index.html` via an inline `@font-face`
(`font-display: swap`) plus a `<link rel="preload" as="font" crossorigin>`. This removed the old
render-blocking `preconnect` + css2 stylesheet chain (~1.3 s cross-origin DNS/TLS for a 29.70 KiB woff2):
the font now loads same-origin on the connection already open for the HTML, with no Google request. The
pre-render step drops the preload from the calc routes (the font isn't used there). See PRD §14.

## Supplies import & focus

Since v1.2.11 ([PRD §15](PRD.md)) you can pour your real Granblue stock into the calculators:

- **Import** — the supplies side nav's **Import** view (the file-import icon on the right-edge rail)
  shows an inline form that accepts the in-game item-list JSON
  (the `game.granbluefantasy.jp` supplies response — an array of `{ item_id, number, … }`; sample in
  the git-ignored `response-example/supplies-response.json`), pasted or loaded from a `.json` file.
  Each `item_id` is matched against the `itemId` on every [supplies.js](src/js/supplies.js) item to
  build a `{ key: count }` stock map. **278** items match; weapon-namespace items (they carry weapon
  ids), `rupie`/`crystal`, and the evolution items have no item-path id and are skipped (the form
  reports the matched/skipped counts).
- **Focus** — the ★ button on each unit box spends your stock against that unit's selected
  step range, filling its progress up to what's needed (earliest step first). Focus is **global and
  single**: only one unit across all calculators is focused at a time. Switching focus first **resets**
  the previous unit (restores its progress and returns the spent stock), then applies to the new one,
  so your stock is never double-counted. Clicking ★ first shows a **confirm dialog** (with a
  "don't show this again" option) warning that focus/unfocus overwrites the unit's tracked quantities.
  Deleting a focused unit (🗑) returns its spent stock and clears the focus.
- **Supplies side nav** — an always-visible right-edge **icon rail** with two views: **Supplies**
  (warehouse icon) and **Import supplies** (file-import icon). Clicking either opens its panel (re-clicking
  the active icon collapses it). The Supplies view is a fixed-height, searchable 3-column icon grid (with a
  thin themed scrollbar) showing every owned item with `remaining / owned` underneath, so you can see what
  you have and how much a focus has spent.
- **Focus chip** — when a unit is focused, its name shows (with a ★) at the right of the navbar's
  left link group; clicking it jumps to that unit's calculator and tab and scrolls the unit box into view.

State lives in a small `reactive` store, [src/js/inventory.js](src/js/inventory.js) (no Vuex),
persisted under the `App-inventory` `localStorage` key alongside the other `App-*` keys (the sidebar's
open/closed state under `App-sidebarOpen`).

## Project documentation

See [PRD.md](PRD.md) for the product requirements of this rewrite.
