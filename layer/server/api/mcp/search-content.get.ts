import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'

const querySchema = z.object({
  query: z.string().describe('Search query'),
  locale: z.string().optional().describe('Language code (e.g., "en", "fr")'),
  limit: z.number().optional().default(10).describe('Maximum number of results'),
})

export default defineCachedEventHandler(async (event) => {
  const { query, locale, limit } = await getValidatedQuery(event, querySchema.parse)

  const config = useRuntimeConfig(event).public
  const siteUrl = config.site?.url || 'http://localhost:3000'
  const availableLocales = getAvailableLocales(config)
  const collections = getCollectionsToQuery(locale, availableLocales)

  const allResults = await Promise.all(
    collections.map(async (collectionName) => {
      try {
        const pages = await queryCollection(event, collectionName as keyof Collections)
          .where('title', 'LIKE', `%${query}%`)
          .select('title', 'path', 'description')
          .limit(Number(limit))
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

  return allResults.flat().slice(0, Number(limit))
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const query = getQuery(event)
    return `mcp-search-content-${query.query}-${query.locale || 'all'}`
  },
})
