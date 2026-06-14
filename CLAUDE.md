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

Always refer to PRD.md and propose the changes on PRD.md first. Always keep latest 3 PRD version but condense the rest.

When changes are made, make sure it is also reflected in CLAUDE.md and README.md

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
- `npm run build` — runs the image check first (`prebuild`), then production build into `dist/`, then
  copies `dist/index.html` to `dist/404.html` (GitHub Pages SPA deep-link fallback). A missing item
  icon fails the build.
- `npm run preview` — serve the production build locally
- A committed `.githooks/pre-commit` runs `npm test` on every commit (since v1.2.3, PRD §8 changelog);
  it is wired by the `prepare` script (`git config core.hooksPath .githooks`) on `npm install`.
  Bypassable with `git commit --no-verify` — `prebuild`/CI is the hard gate.

## Architecture

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
  silver relic / revenant) and the 4 animated `.gif` items have none (PRD §9). `public/img/item/` is
  one image per item. WikiParser has no item-image code path (only chara/summon/weapon), so item
  icons are fetched via its own `download()` using a hand-authored manifest. `WikiParser/data/supplies.images`
  is the manifest for every static (`.jpg`) item — since v1.2.4 the 282 items with an `itemId` point
  at the official CDN (`prd-game-a-granbluefantasy.akamaized.net/.../item/article/s/<itemId>.jpg`, or
  `item/normal/s/{lupi,gem}.jpg` for `rupie`/`crystal`). All 30 weapons (no `itemId`) are on the
  CDN's weapon path (`.../assets/weapon/s/<weaponId>.jpg`, ids supplied directly, kept only in the
  manifest — rusted `1030…`, silver relics + revenant `1040…`); the 4 animated (`.gif`) items are
  excluded (different source). Full id reference: `About items.md`. `scripts/check-item-images.js`
  (npm `test` / `prebuild`) asserts every `supplies.js` item has its `public/img/item/<key>.<jpg|gif>`.
  Other data is regenerable by `WikiParser/` (Python, not part of the web build — preserve it).
- Components use the Options API, mirroring the upstream project; keep that style for consistency.
- The Vite/router base is `/raziel-ledger/` (`vite.config.js`); asset URLs in code must be prefixed
  with `import.meta.env.BASE_URL` (item images live in `public/img/item/`).
- Theming: three CSS-variable themes (`theme-dark`/`theme-blue`/`theme-light`) in `src/css/theme.css`,
  consumed by Tailwind config colors (`bg-primary`, `text-primary`, etc.).
- `public/img/raziel-ledger-lettering.svg` — hand-authored calligraphy SVG (Great Vibes font, `fill: currentColor`);
  inlined in `Home.vue` with `class="text-primary"` so it inherits `--color-text-primary` and responds to all three
  themes. Google Fonts (Great Vibes) is loaded globally in `index.html` (not in the SVG `@import`, which would be
  blocked when the SVG is loaded as `<img>`). This file is **not** a game asset — never overwrite with `download()`.

## Deployment

Push to `main` runs `.github/workflows/deploy.yml` (build + `actions/deploy-pages`). Repository
setting **Pages → Source** must be **GitHub Actions**.
