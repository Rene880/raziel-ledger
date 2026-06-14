# Raziel Ledger

Material calculators for Granblue Fantasy long-term goals, served as a static SPA on GitHub Pages:

- **/calceternal** — materials to recruit, uncap (5★), and transcend (6★) an Eternal ("40 boxes" method), plus a **Radiance** tab for the Radiance of the Eternal levels 1–5
- **/calcevoker** — materials to obtain an Arcarum summon, recruit its Evoker, and uncap the New World Foundation weapon

All progress is stored in your browser's `localStorage`. There are no accounts and no backend.

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
Pages URL. `robots.txt`/`sitemap.xml` aren't included: at a project subpath they aren't honored —
crawlers only read `https://<user>.github.io/robots.txt`, served from your user/org page repo. See PRD §11.

## Project documentation

See [PRD.md](PRD.md) for the product requirements of this rewrite.
