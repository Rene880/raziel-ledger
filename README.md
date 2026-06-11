# Raziel Ledger

Material calculators for Granblue Fantasy long-term goals, served as a static SPA on GitHub Pages:

- **/calceternal** — materials to recruit, uncap (5★), and transcend (6★) an Eternal ("40 boxes" method)
- **/calcevoker** — materials to obtain an Arcarum summon, recruit its Evoker, and uncap the New World Foundation weapon

All progress is stored in your browser's `localStorage`. There are no accounts and no backend.

## Attribution

This project is a Vue 3 + Vite rewrite of the calculators from
**[Minimalist3/GranblueParty](https://github.com/Minimalist3/GranblueParty)** (granblue.party) by Minimalist,
licensed under the [GPL-3.0](LICENSE). The calculator logic, game data, item images, and styling originate
from that project; the game data and item images are trimmed to the entries the two calculators use
(see PRD §8 for the details and exceptions). The [WikiParser/](WikiParser/) tooling (which generates the game data and images from
[gbf.wiki](https://gbf.wiki)) is preserved verbatim for later use.

Granblue Fantasy content and materials are trademarks and copyrights of Cygames, Inc. or its licensors.

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # static build in dist/ (also creates the SPA 404.html fallback)
npm run preview  # preview the production build
```

## Deployment

Pushing to `main` triggers [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the app
and publishes `dist/` to GitHub Pages. In the repository settings, set **Pages → Source** to **GitHub Actions**.

The app is built with base path `/raziel-ledger/` (see [vite.config.js](vite.config.js)); change it if the
repository is renamed or a custom domain is used. SPA deep links work through the `404.html` copy of
`index.html` created by the build script.

## Project documentation

See [PRD.md](PRD.md) for the product requirements of this rewrite.
