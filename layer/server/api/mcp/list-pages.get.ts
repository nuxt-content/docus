import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'

const querySchema = z.object({
  locale: z.string().optional().describe('Language code (e.g., "en", "fr")'),
})

export default defineCachedEventHandler(async (event) => {
  const { locale } = await getValidatedQuery(event, querySchema.parse)
  const config = useRuntimeConfig(event).public

  // @ts-expect-error - FIXME: This should be typed
  const siteUrl = config.site?.url || 'http://localhost:3000'
  const availableLocales = getAvailableLocales(config)
  const collections = getCollectionsToQuery(locale, availableLocales)

  const allPages = await Promise.all(
    collections.map(async (collectionName) => {
      try {
        const pages = await queryCollection(event, collectionName as keyof Collections)
          .select('title', 'path', 'description')
          .all()

        return pages.map(page => ({
          title: page.title,
          path: page.path,
          description: page.description,
          locale: collectionName.replace('docs_', ''),
          url: `${siteUrl}${page.path}`,
        }))
      }
      catch {
        return []
      }
    }),
  )

  return allPages.flat()
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const query = getQuery(event)
    return `mcp-list-pages-${query.locale || 'all'}`
  },
})
