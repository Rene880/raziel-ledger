import { createRouter, createWebHistory } from 'vue-router'

// Production origin used for canonical / Open Graph URLs (no trailing slash).
// The Vite base is a subpath, so these must be absolute (see PRD §11/§12).
const SITE_ORIGIN = 'https://rene880.github.io/raziel-ledger'
const SITE_NAME = 'Raziel Ledger'
const DEFAULT_TITLE = 'Raziel Ledger - Granblue Fantasy Calculators'
const DEFAULT_DESCRIPTION = 'Material calculators for Granblue Fantasy Eternals and Evokers'
const OG_IMAGE = `${SITE_ORIGIN}/img/og-preview.png`

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/Home.vue'),
      meta: {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
      },
    },
    {
      path: '/calceternal',
      name: 'calceternal',
      component: () => import('@/pages/CalcEternal.vue'),
      meta: {
        title: 'Eternals Calculator - Raziel Ledger',
        description:
          'Track the materials to recruit, transcend, and raise the Radiance of Granblue Fantasy Eternals.',
      },
    },
    {
      path: '/calcevoker',
      name: 'calcevoker',
      component: () => import('@/pages/CalcEvoker.vue'),
      meta: {
        title: 'Evokers Calculator - Raziel Ledger',
        description:
          'Track the materials to unlock and uncap Granblue Fantasy Evokers and their weapons.',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFound.vue'),
      meta: {
        title: 'Page Not Found - Raziel Ledger',
        description: DEFAULT_DESCRIPTION,
      },
    },
  ]
});

// Per-route <head> metadata. The static tags in index.html are what link
// scrapers (which do not run JS) read; this hook keeps the document title and
// the JS-rendered meta (Googlebot, in-app tab title) in sync per route. SSR is
// still out of scope — see PRD §12.
function setMetaContent(selector, content) {
  const el = document.querySelector(selector)
  if (el) el.setAttribute('content', content)
}

function setCanonical(url) {
  const el = document.querySelector('link[rel="canonical"]')
  if (el) el.setAttribute('href', url)
}

router.afterEach((to) => {
  const meta = to.meta || {}
  const title = meta.title || DEFAULT_TITLE
  const description = meta.description || DEFAULT_DESCRIPTION
  const path = to.path === '/' ? '/' : to.path
  const url = `${SITE_ORIGIN}${path}`

  document.title = title
  setMetaContent('meta[name="title"]', title)
  setMetaContent('meta[name="description"]', description)
  setCanonical(url)

  setMetaContent('meta[property="og:title"]', title)
  setMetaContent('meta[property="og:description"]', description)
  setMetaContent('meta[property="og:url"]', url)
  setMetaContent('meta[property="og:image"]', OG_IMAGE)

  setMetaContent('meta[name="twitter:title"]', title)
  setMetaContent('meta[name="twitter:description"]', description)
  setMetaContent('meta[name="twitter:image"]', OG_IMAGE)
})

export { SITE_NAME }
export default router
