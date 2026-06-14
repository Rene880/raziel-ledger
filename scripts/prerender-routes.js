// Build-time per-route social previews (PRD §13).
//
// vue-router is client-side, so GitHub Pages serves the deep routes
// (/calceternal, /calcevoker) from 404.html — which carries no Open Graph
// tags, so link-preview scrapers (Discord/X/Slack/Facebook) unfurl no card.
// This postbuild step clones the built dist/index.html into a real
// dist/<route>/index.html per route, swapping in that route's static
// <title> / meta / canonical / og: / twitter: tags. The OG *image* stays the
// sitewide og-preview.png. Plain text substitution — no dependency, no SSR.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ROUTES, OG_IMAGE, urlForPath } from '../src/seo/meta.js'

const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, '..', 'dist')

// Escape a value for safe insertion into a double-quoted HTML attribute or
// element text. Replacement uses a function so literal `$` in values is safe.
function esc(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function replaceAttr(html, tagPattern, value) {
  const re = new RegExp(`(${tagPattern}[^>]*\\bcontent=")[^"]*(")`)
  return html.replace(re, (m, pre, post) => `${pre}${esc(value)}${post}`)
}

function renderRoute(template, route) {
  const { title, description } = route
  const url = urlForPath(route.path)
  let html = template

  html = html.replace(
    /<title>[^<]*<\/title>/,
    () => `<title>${esc(title)}</title>`,
  )
  html = replaceAttr(html, '<meta\\s+name="title"', title)
  html = replaceAttr(html, '<meta\\s+name="description"', description)
  html = html.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    (m, pre, post) => `${pre}${esc(url)}${post}`,
  )

  html = replaceAttr(html, '<meta\\s+property="og:title"', title)
  html = replaceAttr(html, '<meta\\s+property="og:description"', description)
  html = replaceAttr(html, '<meta\\s+property="og:url"', url)
  html = replaceAttr(html, '<meta\\s+property="og:image"', OG_IMAGE)

  html = replaceAttr(html, '<meta\\s+name="twitter:title"', title)
  html = replaceAttr(html, '<meta\\s+name="twitter:description"', description)

  return html
}

async function main() {
  const indexPath = join(dist, 'index.html')
  const template = await readFile(indexPath, 'utf8')

  // Only the real, non-root routes need their own file ('/' is already
  // dist/index.html). NotFound is left to the rafgraph 404.html.
  const targets = ROUTES.filter((r) => r.prerender && r.path !== '/')

  for (const route of targets) {
    const slug = route.path.replace(/^\//, '')
    const outDir = join(dist, slug)
    await mkdir(outDir, { recursive: true })
    await writeFile(join(outDir, 'index.html'), renderRoute(template, route))
    console.log(`prerendered dist/${slug}/index.html`)
  }
}

main().catch((err) => {
  console.error('[prerender-routes] failed:', err)
  process.exit(1)
})
