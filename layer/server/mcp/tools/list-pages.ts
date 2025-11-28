import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'
import { getCollectionsToQuery, getAvailableLocales } from '../../utils/content'

export default defineMcpTool({
  description: 'Lists all documentation pages with titles, paths, and descriptions. ALWAYS call this first to discover available pages before using get-page, unless the user provides a specific path.',
  inputSchema: {
    locale: z.string().optional().describe('The locale to filter pages by'),
  },
  cache: '1h',
  handler: async ({ locale }) => {
    const event = useEvent()
    const config = useRuntimeConfig(event).public

    const siteUrl = import.meta.dev ? 'http://localhost:3000' : getRequestURL(event).origin
    const availableLocales = getAvailableLocales(config)
    const collections = getCollectionsToQuery(locale, availableLocales)

    try {
      const allPages = await Promise.all(
        collections.map(async (collectionName) => {
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
        }),
      )

      return jsonResult(allPages.flat())
    }
    catch {
      return errorResult('Failed to list pages')
    }
  },
})
