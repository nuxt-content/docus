import { queryCollection } from '@nuxt/content/server'
import { getAvailableLocales, getCollectionsToQuery } from '../utils/content'
import { inferSiteURL } from '../../utils/meta'

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

  const urls: Array<{ loc: string }> = []

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

        urls.push({
          loc: pagePath,
        })
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

function generateSitemap(urls: Array<{ loc: string }>, siteUrl: string): string {
  const urlEntries = urls
    .map((url) => {
      const loc = siteUrl ? `${siteUrl}${url.loc}` : url.loc
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`
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
