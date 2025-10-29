import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'
import { stringify } from 'minimark/stringify'

const querySchema = z.object({
  path: z.string().describe('The page path (e.g., /en/getting-started/installation)'),
})

export default defineCachedEventHandler(async (event) => {
  const { path } = await getValidatedQuery(event, querySchema.parse)
  const config = useRuntimeConfig(event).public

  const siteUrl = config.site?.url || 'http://localhost:3000'
  const availableLocales = getAvailableLocales(config)
  const collectionName = config.i18n?.locales
    ? getCollectionFromPath(path, availableLocales)
    : 'docs'

  const page = await queryCollection(event, collectionName as keyof Collections)
    .where('path', '=', path)
    .select('title', 'path', 'description', 'body')
    .first()

  if (!page) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found',
    })
  }

  if (page.body.value[0]?.[0] !== 'h1') {
    page.body.value.unshift(['blockquote', {}, page.description])
    page.body.value.unshift(['h1', {}, page.title])
  }

  const content = stringify({ ...page.body, type: 'minimark' }, { format: 'markdown/html' })

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
