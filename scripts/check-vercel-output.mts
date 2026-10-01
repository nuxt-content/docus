/**
 * Checks a `nuxt build --preset vercel` output without deploying it.
 *
 * Usage: node scripts/check-vercel-output.mts <app-dir>
 * - `NUXT_APP_BASE_URL`: same value as the build, static files live under it.
 * - `MAX_FUNCTION_MB`: size budget for the server function (Vercel hard limit is 250 MB).
 */
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const appDir = resolve(process.argv[2] || '.')
const outputDir = join(appDir, '.vercel/output')
const baseURL = (process.env.NUXT_APP_BASE_URL || '/').replace(/^\/|\/$/g, '')
const staticDir = join(outputDir, 'static', baseURL)
const maxFunctionMB = Number(process.env.MAX_FUNCTION_MB || 100)

const failures: string[] = []

function check(label: string, ok: boolean, detail?: string) {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` (${detail})` : ''}`)
  if (!ok) failures.push(label)
}

function readJSON<T>(path: string): T | undefined {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  }
  catch {
    return undefined
  }
}

function walk(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path, files)
    else files.push(path)
  }
  return files
}

function sizeOf(dir: string): number {
  return walk(dir).reduce((total, file) => total + lstatSync(file).size, 0)
}

console.log(`Checking ${relative(process.cwd(), outputDir) || outputDir}${baseURL ? ` with base /${baseURL}/` : ''}\n`)

if (!existsSync(outputDir)) {
  console.error(`✗ ${outputDir} not found, run \`nuxt build\` with \`NITRO_PRESET=vercel\` first`)
  process.exit(1)
}

/*
** Build Output API config
*/
type Route = { src?: string, dest?: string, handle?: string }
const config = readJSON<{ version: number, routes?: Route[], overrides?: Record<string, { path?: string }> }>(join(outputDir, 'config.json'))

check('config.json uses Build Output API v3', config?.version === 3)
check('routes serve the filesystem before the function', !!config?.routes?.some(route => route.handle === 'filesystem'))
check('unmatched routes fall back to the server function', !!config?.routes?.some(route => route.dest === '/__fallback'))

const missingOverrides = Object.keys(config?.overrides || {}).filter(file => !existsSync(join(outputDir, 'static', file)))
check('every clean-URL override points at a static file', missingOverrides.length === 0, missingOverrides.slice(0, 5).join(', '))

/*
** Server function
*/
const functionDir = join(outputDir, 'functions/__fallback.func')
const vcConfig = readJSON<{ runtime?: string, supportsResponseStreaming?: boolean }>(join(functionDir, '.vc-config.json'))

check('server function exists', !!vcConfig)
check('server function runs on Node.js', !!vcConfig?.runtime?.startsWith('nodejs'), vcConfig?.runtime)
// The assistant streams its answer, a buffered response would only show up at the end.
check('server function supports response streaming', vcConfig?.supportsResponseStreaming === true)

const functionMB = sizeOf(functionDir) / 1024 / 1024
check(`server function stays under ${maxFunctionMB} MB`, functionMB <= maxFunctionMB, `${functionMB.toFixed(1)} MB`)

/*
** Prerendered agent and SEO files
*/
for (const file of ['llms.txt', 'llms-full.txt', 'sitemap.md', 'openapi.json']) {
  const path = join(staticDir, file)
  check(`${file} is prerendered`, existsSync(path) && lstatSync(path).size > 0)
}

const openapi = readJSON<{ openapi?: string, paths?: Record<string, unknown> }>(join(staticDir, 'openapi.json'))
check('openapi.json is an OpenAPI 3.1 document with paths', !!openapi?.openapi?.startsWith('3.1') && Object.keys(openapi.paths || {}).length > 0)

const rawPages = walk(join(staticDir, 'raw')).filter(file => file.endsWith('.md'))
check('markdown twins are prerendered under /raw', rawPages.length > 0, `${rawPages.length} files`)

/*
** Prerendered HTML pages
*/
const htmlFiles = walk(staticDir)
  .filter(file => file.endsWith('.html'))
  .filter(file => !relative(staticDir, file).split('/').some(segment => segment.startsWith('_')))
  .filter(file => !/^(?:200|404)\.html$/.test(relative(staticDir, file)))

// Nitro writes prerendered redirects as meta-refresh HTML, which the CDN then serves for the original URL.
const isRedirectStub = (file: string) => /<meta http-equiv="refresh"/.test(readFileSync(file, 'utf8'))
const redirectStubs = htmlFiles.filter(isRedirectStub).map(file => relative(staticDir, file))
const htmlPages = htmlFiles.filter(file => !redirectStubs.includes(relative(staticDir, file)))

check('no redirect is prerendered as an HTML stub', redirectStubs.length === 0, redirectStubs.slice(0, 5).join(', '))
check('pages are prerendered', htmlPages.length > 0, `${htmlPages.length} pages`)

const withoutLang: string[] = []
const withoutOgImage: string[] = []
const brokenOgImage: string[] = []

for (const page of htmlPages) {
  const html = readFileSync(page, 'utf8')
  const name = relative(staticDir, page)

  if (!/<html[^>]*\slang="[^"]+"/.test(html)) withoutLang.push(name)

  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]
  // Landings (`index.html`, `en.html`) can be a user `app/pages/index.vue` without OG.
  const isLanding = !name.includes('/') && (name === 'index.html' || existsSync(join(staticDir, name.replace(/\.html$/, ''))))
  if (!ogImage) {
    if (!isLanding) withoutOgImage.push(name)
    continue
  }

  // Zero-runtime OG images are only generated at prerender time, so the file must be there.
  const ogPath = new URL(ogImage, 'http://localhost').pathname
  if (!existsSync(join(outputDir, 'static', decodeURIComponent(ogPath)))) brokenOgImage.push(`${name} → ${ogPath}`)
}

check('every page sets `<html lang>`', withoutLang.length === 0, withoutLang.slice(0, 5).join(', '))
check('every content page has an og:image', withoutOgImage.length === 0, withoutOgImage.slice(0, 5).join(', '))
check('every og:image is a prerendered file', brokenOgImage.length === 0, brokenOgImage.slice(0, 3).join(', '))

console.log()
if (failures.length) {
  console.error(`${failures.length} check(s) failed`)
  process.exit(1)
}
console.log('All checks passed')
