// Shared route SEO metadata — single source of truth for both the runtime
// router hook (src/router/index.js, since v1.2.8) and the build-time
// pre-render script (scripts/prerender-routes.js, since v1.2.9). Keep this
// module dependency-free (no vue-router, no import.meta) so plain Node can
// import it. See PRD §13.

// Production origin used for canonical / Open Graph URLs (no trailing slash).
// The Vite base is a subpath, so these must be absolute (see PRD §11/§12).
export const SITE_ORIGIN = 'https://rene880.github.io/raziel-ledger'
export const SITE_NAME = 'Raziel Ledger'
export const DEFAULT_TITLE = 'Raziel Ledger - Granblue Fantasy Calculators'
export const DEFAULT_DESCRIPTION =
  'Material calculators for Granblue Fantasy Eternals and Evokers'
export const OG_IMAGE = `${SITE_ORIGIN}/img/og-preview.png`

// Per-route SEO metadata. `path` matches the vue-router path; `prerender`
// flags the real routes that get a static dist/<route>/index.html file
// (the NotFound catch-all is intentionally left to the rafgraph 404.html).
export const ROUTES = [
  {
    path: '/',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    prerender: true,
  },
  {
    path: '/calceternal',
    title: 'Eternals Calculator - Raziel Ledger',
    description:
      'Track the materials to recruit, transcend, and raise the Radiance of Granblue Fantasy Eternals.',
    prerender: true,
  },
  {
    path: '/calcevoker',
    title: 'Evokers Calculator - Raziel Ledger',
    description:
      'Track the materials to unlock and uncap Granblue Fantasy Evokers and their weapons.',
    prerender: true,
  },
  {
    path: '/calcbullet',
    title: 'Bullets Calculator - Raziel Ledger',
    description:
      'Track the materials to craft Granblue Fantasy bullets, with sub-bullet and stock deduction.',
    prerender: true,
  },
  {
    path: '/:pathMatch(.*)*',
    title: 'Page Not Found - Raziel Ledger',
    description: DEFAULT_DESCRIPTION,
    prerender: false,
  },
]

// Absolute canonical / og:url for a route path ('/' stays bare origin + '/').
export function urlForPath(path) {
  return `${SITE_ORIGIN}${path}`
}
