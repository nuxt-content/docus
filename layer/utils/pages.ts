import { existsSync, readdirSync } from 'node:fs'
import { joinURL } from 'ufo'
import { getLocaleKey, normalizeLocale } from './locale'

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

export interface ContentSourceOptions {
  /** Instance name, `docs` or `docs_<locale key>`. */
  name: string
  /** Folder in `content/`, as written on disk. */
  dir: string
  prefix: string
  /** Globs, relative to `dir`, of the files Docus doesn't serve. */
  exclude: string[]
}

/**
 * The content sources Docus serves: `content/` as one source, or one per locale that has a folder.
 * In each: `index.md` is left to an app `app/pages/index.vue`, and a `docs/` folder hides its siblings.
 */
export function getContentSources(rootDir: string, locales?: string[]): ContentSourceOptions[] {
  const contentDir = joinURL(rootDir, 'content')
  const hasLandingPage = landingPageExists(rootDir)

  const excludeIn = (dir: string) => {
    const exclude: string[] = []
    if (hasLandingPage && existsSync(joinURL(contentDir, dir, 'index.md'))) {
      exclude.push('index.md')
    }
    if (existsSync(joinURL(contentDir, dir, 'docs'))) {
      exclude.push(...readdirSync(joinURL(contentDir, dir), { withFileTypes: true })
        .filter(entry => entry.name !== 'docs' && entry.name !== 'index.md')
        .map(entry => entry.isDirectory() ? `${entry.name}/**` : entry.name))
    }
    return exclude
  }

  if (!locales) return [{ name: 'docs', dir: '', prefix: '', exclude: excludeIn('') }]

  return locales.flatMap((locale) => {
    const code = normalizeLocale(locale)
    const dir = findLocaleFolder(rootDir, code)
    return dir ? [{ name: `docs_${getLocaleKey(code)}`, dir, prefix: `/${code}`, exclude: excludeIn(dir) }] : []
  })
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
