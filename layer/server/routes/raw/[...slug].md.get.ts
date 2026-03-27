// TODO: upstream this fix to @nuxt/content
// Bug: page.body.value is null for pages with no markdown body (e.g. frontmatter-only / config-driven pages).
// The original route crashes at `page.body.value[0]?.[0]` when value is null.
// Fix: return 404 when body.value is null instead of crashing.

// @ts-expect-error — minimark/stringify has no types entry in its exports map
import { stringify } from 'minimark/stringify'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'
// @ts-expect-error — virtual module, no types
import contentCollections from '#content/manifest'
import { withLeadingSlash } from 'ufo'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const llmsConfig = (config as { llms?: { contentRawMarkdown?: boolean | { excludeCollections?: string[] } } }).llms
  const slug = getRouterParam(event, 'slug.md')

  if (!slug?.endsWith('.md') || llmsConfig?.contentRawMarkdown === false) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }

  let path = withLeadingSlash(slug.replace('.md', ''))
  if (path.endsWith('/index')) {
    path = path.substring(0, path.length - 6)
  }

  const excludeCollections: string[] = (llmsConfig?.contentRawMarkdown as { excludeCollections?: string[] } | undefined)?.excludeCollections || []

  const collectionNames: string[] = Object.entries(contentCollections as Record<string, { type: string }>)
    .filter(([key, value]) => value.type === 'page' && !excludeCollections.includes(key))
    .map(([key]) => key)

  let page: { title: string, description: string, body: { value: unknown[] | null }, links?: unknown[], meta?: { links?: unknown[] } } | null = null
  for (const collection of collectionNames) {
    page = await queryCollection(event, collection as keyof Collections).path(path).first() as typeof page
    if (page) break
  }

  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }

  // Fix: body.value can be null for pages with no markdown content
  if (!page.body?.value) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }

  if ((page.body.value[0] as unknown[])?.[0] !== 'h1') {
    page.body.value.unshift(['blockquote', {}, page.description])
    page.body.value.unshift(['h1', {}, page.title])
  }

  const links = page.links || page.meta?.links
  if (Array.isArray(links) && links.length > 0) {
    const linkItems = (links as { label?: string, to?: string }[])
      .filter(link => link.label && link.to)
      .map(link => ['li', {}, ['a', { href: link.to }, link.label]])
    if (linkItems.length > 0) {
      page.body.value.push(['hr'])
      page.body.value.push(['ul', {}, ...linkItems])
    }
  }

  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return stringify({ ...page.body, type: 'minimark' }, { format: 'markdown/html' })
})
