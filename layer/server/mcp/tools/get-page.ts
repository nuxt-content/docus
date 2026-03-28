import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'
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
  inputSchema: {
    path: z.string().describe('The page path from list-pages or provided by the user (e.g., /en/getting-started/installation)'),
  },
  cache: '1h',
  handler: async ({ path }) => {
    const event = useEvent()
    const config = useRuntimeConfig(event).public
    const appConfig = useAppConfig() as { github?: { rootDir?: string } }
    const contentRepoBase = appConfig.github?.rootDir
      ? `${appConfig.github.rootDir}/content`
      : 'content'
    const siteUrl = getRequestURL(event).origin || inferSiteURL()

    const availableLocales = getAvailableLocales(config as unknown as Parameters<typeof getAvailableLocales>[0])
    const collectionName = config.i18n?.locales
      ? getCollectionFromPath(path, availableLocales)
      : 'docs'

    let page: { title: string, path: string, description: string, stem: string, extension: string, body: { value: unknown[] | null } | null } | null
    try {
      page = await queryCollection(event, collectionName as keyof Collections)
        .where('path', '=', path)
        .select('title', 'path', 'description', 'stem', 'extension', 'body')
        .first() as typeof page
    }
    catch {
      return errorResult('Failed to query page')
    }

    if (!page) {
      return errorResult('Page not found')
    }

    let content: string | undefined
    if (page.body?.value) {
      try {
        content = await event.$fetch<string>(`/raw${path}.md`)
      }
      catch {
        // Raw fetch failed — return page metadata without content
      }
    }

    return jsonResult({
      title: page.title,
      path: page.path,
      description: page.description,
      filePath: `${contentRepoBase}/${page.stem}.${page.extension}`,
      content,
      url: `${siteUrl}${page.path}`,
    })
  },
})
