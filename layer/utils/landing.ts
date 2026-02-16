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
