import { createRouter, createWebHistory } from 'vue-router'
import {
  SITE_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  OG_IMAGE,
  ROUTES,
  urlForPath,
} from '@/seo/meta'

// Pull { title, description } for a route from the shared SEO table so the
// router and the build-time pre-render script never drift (PRD §13 S1).
function metaForPath(path) {
  const entry = ROUTES.find((r) => r.path === path)
  return {
    title: entry?.title ?? DEFAULT_TITLE,
    description: entry?.description ?? DEFAULT_DESCRIPTION,
  }
}

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
      meta: metaForPath('/'),
    },
    {
      path: '/calceternal',
      name: 'calceternal',
      component: () => import('@/pages/CalcEternal.vue'),
      meta: metaForPath('/calceternal'),
    },
    {
      path: '/calcevoker',
      name: 'calcevoker',
      component: () => import('@/pages/CalcEvoker.vue'),
      meta: metaForPath('/calcevoker'),
    },
    {
      path: '/calcbullet',
      name: 'calcbullet',
      component: () => import('@/pages/CalcBullets.vue'),
      meta: metaForPath('/calcbullet'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFound.vue'),
      meta: metaForPath('/:pathMatch(.*)*'),
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
  const url = urlForPath(path)

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
