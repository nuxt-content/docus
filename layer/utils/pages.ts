import { existsSync, readdirSync } from 'node:fs'
import { joinURL } from 'ufo'
import { normalizeLocale } from './locale'

/**
 * Checks if the user has their own index.vue file in the pages folder.
 * When true, the layer should not define the landing collection and / route.
 */
export function landingPageExists(rootDir: string): boolean {
  const vueLandingPath = joinURL(rootDir, 'app', 'pages', 'index.vue')
  return existsSync(vueLandingPath)
}

/**
 * Checks if a docs folder exists in the content directory.
 * When true, docs should be prefixed with /docs and only include files from the docs folder.
 */
export function docsFolderExists(rootDir: string, locale?: string): boolean {
  const docsPath = locale
    ? joinURL(rootDir, 'content', locale, 'docs')
    : joinURL(rootDir, 'content', 'docs')
  return existsSync(docsPath)
}

/**
 * Globs, relative to `content/`, of the files Docus doesn't serve. With `locales`, only their folders are served.
 * In each served folder: `index.md` is left to an app `app/pages/index.vue`, and a `docs/` folder hides its siblings.
 */
export function getContentExclude(rootDir: string, locales?: string[]): string[] {
  const contentDir = joinURL(rootDir, 'content')
  if (!existsSync(contentDir)) return []

  const hasLandingPage = landingPageExists(rootDir)
  const entries = (dir: string) => readdirSync(joinURL(contentDir, dir), { withFileTypes: true })
    .map(entry => ({ path: dir ? `${dir}/${entry.name}` : entry.name, name: entry.name, isDirectory: entry.isDirectory() }))
  const glob = (entry: { path: string, isDirectory: boolean }) => entry.isDirectory ? `${entry.path}/**` : entry.path

  const excludeIn = (dir: string) => {
    const exclude: string[] = []
    if (hasLandingPage && existsSync(joinURL(contentDir, dir, 'index.md'))) {
      exclude.push(dir ? `${dir}/index.md` : 'index.md')
    }
    if (existsSync(joinURL(contentDir, dir, 'docs'))) {
      exclude.push(...entries(dir).filter(entry => entry.name !== 'docs' && entry.name !== 'index.md').map(glob))
    }
    return exclude
  }

  if (!locales) return excludeIn('')

  const codes = locales.map(normalizeLocale)
  return entries('').flatMap(entry => entry.isDirectory && codes.includes(normalizeLocale(entry.name))
    ? excludeIn(entry.name)
    : [glob(entry)])
}

/**
 * Finds the content folder for a locale, ignoring case so `content/zh-TW/` and
 * `content/zh-tw/` both work. Returns the name as it is on disk.
 */
export function findLocaleFolder(rootDir: string, locale: string): string | undefined {
  const contentDir = joinURL(rootDir, 'content')
  if (!existsSync(contentDir)) return undefined

  return readdirSync(contentDir).find(dir => normalizeLocale(dir) === normalizeLocale(locale))
}
