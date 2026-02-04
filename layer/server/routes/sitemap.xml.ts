import { queryCollection } from '@nuxt/content/server'
import { getAvailableLocales, getCollectionsToQuery } from '../utils/content'
import { inferSiteURL } from '../../utils/meta'

interface SitemapUrl {
  loc: string
  lastmod?: string
}

export default defineEventHandler(async (event) => {
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

  const urls: SitemapUrl[] = []

  for (const collection of collections) {
    try {
      const pages = await queryCollection(event, collection as 'docs').all()

      for (const page of pages) {
        const meta = page as unknown as Record<string, unknown>
        const pagePath = (page.path as string) || '/'

        // Skip pages with sitemap: false in frontmatter
        if (meta.sitemap === false) continue

        // Skip .navigation files (used for navigation configuration)
        if (pagePath.endsWith('.navigation') || pagePath.includes('/.navigation')) continue

        const urlEntry: SitemapUrl = {
          loc: pagePath,
        }

        // Add lastmod if available (modifiedAt from content)
        if (meta.modifiedAt && typeof meta.modifiedAt === 'string') {
          urlEntry.lastmod = meta.modifiedAt.split('T')[0] // Use date part only (YYYY-MM-DD)
        }

        urls.push(urlEntry)
      }
    }
    catch {
      // Collection might not exist, skip it
    }
  }

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
