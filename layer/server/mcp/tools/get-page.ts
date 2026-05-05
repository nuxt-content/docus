import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'
import { useLogger, createError } from 'evlog'
import { getAvailableLocales, getCollectionFromPath } from '../../utils/content'
import { inferSiteURL } from '../../../utils/meta'

export default defineMcpTool({
  description: `Retrieves the full content and details of a specific documentation page.

WHEN TO USE: Use this tool when you know the EXACT path to a documentation page. Common use cases:
- User asks for a specific page: "Show me the getting started guide" → /en/getting-started/installation
- User asks about a known topic with a dedicated page
- You found a relevant path from list-pages and want the full content
- User references a specific section or guide they want to read

WHEN NOT TO USE: If you don't know the exact path and need to search/explore, use list-pages first.

WORKFLOW: This tool returns the complete page content including title, description, and full markdown. Use this when you need to provide detailed answers or code examples from specific documentation pages.
`,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    path: z.string().describe('The page path from list-pages or provided by the user (e.g., /en/getting-started/installation)'),
  },
  inputExamples: [
    { path: '/en/getting-started/installation' },
    { path: '/getting-started/introduction' },
  ],
  cache: '1h',
  handler: async ({ path }) => {
    const event = useEvent()
    const log = useLogger(event)
    const config = useRuntimeConfig(event).public
    const siteUrl = getRequestURL(event).origin || inferSiteURL()

    const availableLocales = getAvailableLocales(config)
    const collectionName = config.i18n?.locales
      ? getCollectionFromPath(path, availableLocales)
      : 'docs'

    log.set({ content: { path, collectionName } })

    try {
      const page = await queryCollection(event, collectionName as keyof Collections)
        .where('path', '=', path)
        .select('title', 'path', 'description')
        .first()

      if (!page) {
        const err = createError({
          message: `Page "${path}" not found in collection "${collectionName}"`,
          status: 404,
          why: 'No content document matches this path',
          fix: 'Call list-pages to discover available paths or check the locale prefix',
        })
        log.error(err)
        throw err
      }

      const content = await event.$fetch<string>(`/raw${path}.md`)

      log.set({
        content: {
          path,
          collectionName,
          title: page.title,
          contentLength: content?.length ?? 0,
        },
      })

      return {
        title: page.title,
        path: page.path,
        description: page.description,
        content,
        url: `${siteUrl}${page.path}`,
      }
    }
    catch (error) {
      const status = (error as { status?: number, statusCode?: number }).status
        ?? (error as { statusCode?: number }).statusCode
      if (status === 404) throw error
      const err = createError({
        message: 'Failed to get page',
        status: 500,
        why: `Underlying query for "${path}" in "${collectionName}" failed`,
        fix: 'Check that the content collection is built and the path is correctly prefixed',
        cause: error as Error,
      })
      log.error(err)
      throw err
    }
  },
})
