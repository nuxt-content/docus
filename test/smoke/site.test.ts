import { beforeAll, describe, expect, it } from 'vitest'
import type { DocsPage } from './utils'
import { assistantEnabled, assistantPath, canonicalSiteURL, listPages, mcp, request, requestHTML, siteURL, target, url } from './utils'

function sitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]!.trim())
}

let page: DocsPage

beforeAll(async () => {
  const pages = await listPages()
  page = pages[0]!
})

describe(`smoke: ${siteURL.href} (${target})`, () => {
  describe('pages', () => {
    it('serves the landing page', async () => {
      const res = await requestHTML('/')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/html')
      expect(await res.text()).toMatch(/<html[^>]*\slang="[^"]+"/)
    })

    it('serves a documentation page', async () => {
      const res = await requestHTML(page.path)
      expect(res.status).toBe(200)
      expect(await res.text()).toContain(`<title>${page.title}`)
    })

    it('returns a 404 for unknown pages', async () => {
      const res = await requestHTML(`${page.locale ? `/${page.locale}` : ''}/__docus-smoke-not-found__`)
      expect(res.status).toBe(404)
    })

    it('redirects uppercase locale prefixes to lowercase', async ({ skip }) => {
      if (!page.locale) skip('i18n is not enabled')

      const path = page.path.replace(`/${page.locale}`, `/${page.locale!.toUpperCase()}`)
      const res = await requestHTML(path, { redirect: 'manual' })
      expect(res.status).toBe(301)
      expect(new URL(res.headers.get('location')!, siteURL).pathname).toBe(url(page.path).pathname)
    })

    // Zero-runtime OG images only exist for prerendered HTML, which `node-server` does not serve on clean URLs.
    it.skipIf(target !== 'vercel')('links a prerendered og:image', async () => {
      const html = await (await requestHTML(page.path)).text()
      const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]
      expect(ogImage).toBeTruthy()

      const res = await request(new URL(ogImage!, siteURL).pathname)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('image/png')
    })
  })

  describe('markdown', () => {
    it('serves the raw markdown twin', async () => {
      const res = await request(`/raw${page.path}.md`)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/markdown')
      expect(await res.text()).toContain(page.title)
    })

    it('serves markdown on `.md` page URLs', async () => {
      const res = await request(`${page.path}.md`)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/markdown')
    })

    it('serves markdown on `Accept: text/markdown`', async () => {
      const res = await request(page.path, { headers: { accept: 'text/markdown' } })
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/markdown')
    })
  })

  describe('agent and SEO files', () => {
    it.each(['/llms.txt', '/llms-full.txt'])('serves %s', async (path) => {
      const res = await request(path)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/plain')
      expect(await res.text()).toMatch(/^# /)
    })

    it('serves sitemap.md', async () => {
      const res = await request('/sitemap.md')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/markdown')
    })

    it('serves the XML sitemap', async () => {
      const res = await request('/sitemap.xml')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toMatch(/xml/)
      expect(await res.text()).toMatch(/<(?:urlset|sitemapindex)\b/)
    })

    // The sitemap protocol requires absolute URLs, see https://github.com/nuxt-content/docus/pull/1422
    it('lists absolute URLs in the XML sitemap', async () => {
      const index = await (await request('/sitemap.xml')).text()
      const isIndex = /<sitemapindex\b/.test(index)
      const sitemaps = isIndex ? sitemapLocs(index) : []

      const locs = isIndex ? [...sitemaps] : sitemapLocs(index)
      for (const sitemap of sitemaps) {
        // Child sitemaps carry the canonical origin, fetch them from the site under test.
        const res = await request(new URL(sitemap, siteURL).pathname)
        expect(res.status, sitemap).toBe(200)
        locs.push(...sitemapLocs(await res.text()))
      }

      expect(locs.length).toBeGreaterThan(0)
      for (const loc of locs) {
        expect(loc).toMatch(/^https?:\/\//)
        if (canonicalSiteURL) expect(new URL(loc).origin).toBe(canonicalSiteURL.origin)
      }
    })

    it('serves robots.txt', async () => {
      const res = await request('/robots.txt')
      expect(res.status).toBe(200)
      expect(await res.text()).toMatch(/^User-agent:/m)
    })

    it('serves the OpenAPI document', async () => {
      const res = await request('/openapi.json')
      expect(res.status).toBe(200)
      const doc = await res.json() as { openapi: string, paths: Record<string, unknown> }
      expect(doc.openapi).toMatch(/^3\.1/)
      expect(Object.keys(doc.paths).length).toBeGreaterThan(0)
    })

    it('serves the MCP server card', async () => {
      const res = await request('/.well-known/mcp/server-card.json')
      expect(res.status).toBe(200)
      const card = await res.json() as { endpoints: Array<{ url: string }> }
      expect(card.endpoints[0]!.url).toMatch(/\/mcp$/)
    })
  })

  describe('mcp', () => {
    it('lists the Docus tools', async () => {
      const { tools } = await mcp<{ tools: Array<{ name: string }> }>('tools/list')
      expect(tools.map(tool => tool.name)).toEqual(expect.arrayContaining(['list-pages', 'get-page']))
    })

    it('lists pages without `.navigation` entries', async () => {
      const pages = await listPages()
      expect(pages.length).toBeGreaterThan(0)
      expect(pages.filter(p => p.path.includes('.navigation'))).toEqual([])
    })

    it('returns the content of a page', async () => {
      const result = await mcp<{ content: Array<{ text: string }>, isError?: boolean }>('tools/call', {
        name: 'get-page',
        arguments: { path: page.path },
      })
      expect(result.isError).toBeFalsy()
      expect(result.content[0]!.text).toContain(page.title)
    })
  })

  describe.runIf(assistantEnabled)('assistant', () => {
    it('streams an answer', async () => {
      const res = await request(assistantPath, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: [{ id: 'smoke', role: 'user', parts: [{ type: 'text', text: 'In one sentence, what is this documentation about?' }] }],
        }),
        signal: AbortSignal.timeout(55_000),
      })
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/event-stream')

      const stream = await res.text()
      expect(stream).not.toContain('"type":"error"')
      expect(stream).toContain('"type":"text-delta"')
      expect(stream).toContain('"type":"finish"')
    })
  })
})
