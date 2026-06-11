# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Prompt Instruction
Draft an "Operating Instructions" doc for my Claude Cowork preferences. Make you a sharp thinking partner, not a yes-machine. Cover:

About Me – Pull from past conversations: name, role, what my company/team does, public work or side projects with specifics, biggest pain points, tools I use. Missing something? Ask – don't guess.

Building anything – PRD first (problem, success criteria, scope, constraints, plan, open questions); get sign-off before building. Check what already exists before proposing custom work.

Pushback – Interrogate vague requests. Disagree when something's off. Flag contradictions before acting – never silently overwrite. No sycophancy.

Reversibility – Before anything destructive (deleting, overwriting, comms in my name, financial actions, mass ops): show the plan, flag what's irreversible, wait for explicit "proceed."

Note-taking – Capture context, decisions, and open threads continuously. Checkpoint before switching domains or when a chat runs long.

Working style – Show reasoning, not just conclusions. Breadth and rigor. Skip filler. If I say "things changed," re-interview me. Show me the draft, then we'll revise.

Always refer to PRD.md and propose the changes on PRD.md first.

When changes are made, make sure it is also reflected in CLAUDE.md and README.md

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
- `npm run build` — production build into `dist/`, then copies `dist/index.html` to `dist/404.html`
  (GitHub Pages SPA deep-link fallback). There are no tests or linters.
- `npm run preview` — serve the production build locally

## Architecture

- `src/pages/` — `Home`, `CalcEternal`, `CalcEvoker`, `NotFound`. The two calc pages own the progress
  state, persist it to `localStorage` (keys `CalcEternal-*` / `CalcEvoker-*` via `js/utils.js`
  `LocalStorageMgt`), and delegate all logic to `components/Calculator.vue`.
- `src/components/Calculator.vue` — generic step/material calculator driven by the data shape in
  `src/js/supplies-{eternals,evokers}.js`. Material "groups" resolve to concrete items per unit
  element/id using `src/js/supplies.js`.
- `src/js/supplies*.js` — frozen game data from GranblueParty, trimmed in v1.1 to the items and
  groups the calculators reference (the unused `rustedweapon` item is a deliberate keep — see PRD
  §8); `public/img/item/` is swept to one image per item. Regenerable by `WikiParser/` (Python,
  not part of the web build — preserve it).
- Components use the Options API, mirroring the upstream project; keep that style for consistency.
- The Vite/router base is `/raziel-ledger/` (`vite.config.js`); asset URLs in code must be prefixed
  with `import.meta.env.BASE_URL` (item images live in `public/img/item/`).
- Theming: three CSS-variable themes (`theme-dark`/`theme-blue`/`theme-light`) in `src/css/theme.css`,
  consumed by Tailwind config colors (`bg-primary`, `text-primary`, etc.).

## Deployment

Push to `main` runs `.github/workflows/deploy.yml` (build + `actions/deploy-pages`). Repository
setting **Pages → Source** must be **GitHub Actions**.
