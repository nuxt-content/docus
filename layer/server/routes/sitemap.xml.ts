import { queryCollection } from '@nuxt/content/server'
import { useLogger } from 'evlog'
import { getAvailableLocales, getCollectionsToQuery } from '../utils/content'
import { inferSiteURL } from '../../utils/meta'

interface SitemapUrl {
  loc: string
  lastmod?: string
}

function isMissingCollectionError(error: unknown): boolean {
  const message = (error as { message?: string }).message ?? ''
  const code = (error as { code?: string }).code
  return code === 'COLLECTION_NOT_FOUND'
    || /no such (?:table|collection)/i.test(message)
    || /collection .* (?:does not exist|not found)/i.test(message)
}

export default defineEventHandler(async (event) => {
  const log = useLogger(event)
  const config = useRuntimeConfig(event)
  const siteUrl = inferSiteURL() || ''

  const availableLocales = getAvailableLocales(config.public as Record<string, unknown>)
  const collections = getCollectionsToQuery(undefined, availableLocales)

  if (availableLocales.length > 0) {
    for (const locale of availableLocales) {
      collections.push(`landing_${locale}`)
    }
  }
  else {
    collections.push('landing')
  }

  log.set({ sitemap: { locales: availableLocales, collectionCount: collections.length } })

  const urls: SitemapUrl[] = []
  const failedCollections: string[] = []

  for (const collection of collections) {
    try {
      const pages = await (queryCollection as unknown as (event: unknown, collection: string) => { all: () => Promise<Array<Record<string, unknown> & { path?: string }>> })(event, collection).all()

      for (const page of pages) {
        const meta = page as Record<string, unknown>
        const pagePath = page.path || '/'

        if (meta.sitemap === false) continue
        if (pagePath.endsWith('.navigation') || pagePath.includes('/.navigation')) continue

        const urlEntry: SitemapUrl = { loc: pagePath }

        if (meta.modifiedAt && typeof meta.modifiedAt === 'string') {
          urlEntry.lastmod = meta.modifiedAt.split('T')[0]
        }

        urls.push(urlEntry)
      }
    }
    catch (error) {
      if (isMissingCollectionError(error)) continue
      failedCollections.push(collection)
      log.error(error as Error, {
        sitemap: { failedCollection: collection },
      })
    }
  }

  log.set({
    sitemap: {
      locales: availableLocales,
      collectionCount: collections.length,
      urlCount: urls.length,
      failedCollections,
    },
  })

  const sitemap = generateSitemap(urls, siteUrl)

  setResponseHeader(event, 'content-type', 'application/xml')
  return sitemap
})

function generateSitemap(urls: SitemapUrl[], siteUrl: string): string {
  const urlEntries = urls
    .map((url) => {
      const loc = siteUrl ? `${siteUrl}${url.loc}` : url.loc
      let entry = `  <url>\n    <loc>${escapeXml(loc)}</loc>`

      if (url.lastmod) {
        entry += `\n    <lastmod>${escapeXml(url.lastmod)}</lastmod>`
      }

      entry += `\n  </url>`
      return entry
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
