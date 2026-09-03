import { queryCollection } from '@nuxt/content/server'
import { getAvailableLocales, getCollectionsToQuery, isNavigationPath } from '../../utils/content'

type Page = Record<string, unknown> & { path?: string, meta?: Record<string, unknown> }

/**
 * Every content page, for `@nuxtjs/sitemap`. Content is the single source of
 * truth here: the prerendered routes are excluded, so a page opting out with
 * `sitemap: false` in its frontmatter stays out.
 */
export default defineSitemapEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const availableLocales = getAvailableLocales(config.public as Record<string, unknown>)
  const collections = getCollectionsToQuery(undefined, availableLocales)

  if (availableLocales.length > 0) {
    for (const locale of availableLocales) {
      collections.push(`landing_${locale}`)
    }
  }
  else {
    collections.push('landing')
  }

  const urls: Array<{ loc: string, lastmod?: string }> = []

  for (const collection of collections) {
    // Collection might not exist, skip it
    const pages = await (queryCollection as unknown as (event: unknown, collection: string) => { all: () => Promise<Page[]> })(event, collection).all().catch(() => [] as Page[])

    for (const page of pages) {
      const meta = page.meta || {}
      const path = page.path || '/'

      if (meta.sitemap === false || isNavigationPath(path)) {
        continue
      }

      urls.push({
        loc: path,
        // Date part only (YYYY-MM-DD)
        lastmod: typeof meta.modifiedAt === 'string' ? meta.modifiedAt.split('T')[0] : undefined,
      })
    }
  }

  return urls
})
