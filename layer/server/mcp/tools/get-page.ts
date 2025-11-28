import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'
import { getAvailableLocales, getCollectionFromPath } from '../../utils/content'
import { inferSiteURL } from '../../../utils/meta'

export default defineMcpTool({
  description: 'Retrieves the full markdown content of a documentation page. Use this after list-pages to read specific pages, or directly if the user provides a path.',
  inputSchema: {
    path: z.string().describe('The page path from list-pages or provided by the user (e.g., /en/getting-started/installation)'),
  },
  cache: '1h',
  handler: async ({ path }) => {
    const event = useEvent()
    const config = useRuntimeConfig(event).public
    const siteUrl = import.meta.dev ? 'http://localhost:3000' : inferSiteURL()

    const availableLocales = getAvailableLocales(config)
    const collectionName = config.i18n?.locales
      ? getCollectionFromPath(path, availableLocales)
      : 'docs'

    try {
      const page = await queryCollection(event, collectionName as keyof Collections)
        .where('path', '=', path)
        .select('title', 'path', 'description')
        .first()

      if (!page) {
        return errorResult('Page not found')
      }

      const content = await $fetch<string>(`/raw${path}.md`, {
        baseURL: siteUrl,
      })

      return jsonResult({
        title: page.title,
        path: page.path,
        description: page.description,
        content,
        url: `${siteUrl}${page.path}`,
      })
    }
    catch {
      return errorResult('Failed to get page')
    }
  },
})
