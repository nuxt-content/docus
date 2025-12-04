import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'
import { getCollectionsToQuery, getAvailableLocales } from '../../utils/content'

export default defineMcpTool({
  description: `Lists all available documentation pages with their categories and basic information.

WHEN TO USE: Use this tool when you need to EXPLORE or SEARCH for documentation about a topic but don't know the exact page path. Common scenarios:
- "Find documentation about markdown features" - explore available guides
- "Show me all getting started guides" - browse introductory content
- "Search for advanced configuration options" - find specific topics
- User asks general questions without specifying exact pages
- You need to understand the overall documentation structure

WHEN NOT TO USE: If you already know the specific page path (e.g., "/en/getting-started/installation"), use get-page directly instead.

WORKFLOW: This tool returns page titles, descriptions, and paths. After finding relevant pages, use get-page to retrieve the full content of specific pages that match the user's needs.

OUTPUT: Returns a structured list with:
- title: Human-readable page name
- path: Exact path for use with get-page
- description: Brief summary of page content
- url: Full URL for reference`,
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
