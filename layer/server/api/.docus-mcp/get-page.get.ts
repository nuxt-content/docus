import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'
import { getAvailableLocales, getCollectionFromPath } from '../../utils/content'

const querySchema = z.object({
  path: z.string().describe('The page path (e.g., /en/getting-started/installation)'),
})

export default defineCachedEventHandler(async (event) => {
  const { path } = await getValidatedQuery(event, querySchema.parse)
  const config = useRuntimeConfig(event).public

  const siteUrl = import.meta.dev ? 'http://localhost:3000' : getRequestURL(event).origin
  const availableLocales = getAvailableLocales(config)
  const collectionName = config.i18n?.locales
    ? getCollectionFromPath(path, availableLocales)
    : 'docs'

  const page = await queryCollection(event, collectionName as keyof Collections)
    .where('path', '=', path)
    .select('title', 'path', 'description')
    .first()

  if (!page) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found',
    })
  }

  const content = await $fetch<string>(`/raw${path}.md`, {
    baseURL: siteUrl,
  }).catch(() => {
    throw createError({
      statusCode: 404,
      statusMessage: 'Raw content not found',
    })
  })

  return {
    title: page.title,
    path: page.path,
    description: page.description,
    content,
    url: `${siteUrl}${page.path}`,
  }
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const query = getQuery(event)
    return `mcp-get-page-${query.path}`
  },
})
