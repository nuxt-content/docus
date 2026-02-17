import { existsSync } from 'node:fs'
import { joinURL } from 'ufo'

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
