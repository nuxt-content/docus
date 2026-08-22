import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createCloudflareModuleWorkerRoutes,
  createMarkdownRoutes,
  createVercelNegotiationRoutes,
  getMarkdownPath,
  getPrerenderedHtmlPaths,
  negotiateContentType,
  withMarkdownHeaders,
} from '../layer/modules/runtime/server/utils/markdown-negotiation.ts'

describe('Markdown negotiation', () => {
  it('honors Accept quality and curl fallback', () => {
    assert.equal(negotiateContentType('text/html, text/markdown;q=0.5'), 'text/html')
    assert.equal(negotiateContentType('text/markdown, text/html;q=0.5'), 'text/markdown')
    assert.equal(negotiateContentType('application/pdf'), undefined)
    assert.equal(negotiateContentType('text/markdown;q=0'), undefined)
    assert.equal(negotiateContentType('text/markdown;q=invalid'), undefined)
    assert.equal(negotiateContentType('text/markdown;q=0, text/markdown;q=0.2'), 'text/markdown')
    assert.equal(negotiateContentType('*/*', 'curl/8.7.1'), 'text/markdown')
    assert.equal(negotiateContentType('*/*,image/webp', 'curl/8.7.1'), 'text/markdown')
    assert.equal(negotiateContentType('text/html', 'curl/8.7.1'), 'text/html')
  })

  it('maps pages listed in llms.txt and accepts canonical trailing slashes', () => {
    const routes = createMarkdownRoutes(`
- [Guide](https://docs.example.com/raw/docs/guide.md)
- [Blog](/raw/blog/agents.md)
- [Home](/raw/index.md)
- [French home](/raw/fr/index.md)
- [External](https://example.com/guide.md)
`, ['fr'])

    assert.deepEqual(routes, {
      '/': '/raw/index.md',
      '/fr': '/raw/fr/index.md',
      '/docs/guide': '/raw/docs/guide.md',
      '/blog/agents': '/raw/blog/agents.md',
    })
    assert.equal(getMarkdownPath('/docs/guide/', routes), '/raw/docs/guide.md')
    assert.equal(getMarkdownPath('/blog/agents/', routes), '/raw/blog/agents.md')
    assert.equal(getMarkdownPath('/missing', routes), undefined)
    assert.deepEqual(createMarkdownRoutes('', ['fr']), {})
  })

  it('finds prerendered HTML files that would bypass negotiation', () => {
    assert.deepEqual(getPrerenderedHtmlPaths({
      '/': '/raw/index.md',
      '/docs/guide': '/raw/docs/guide.md',
    }), [
      'index.html',
      'index/index.html',
      'docs/guide.html',
      'docs/guide/index.html',
    ])
  })

  it('routes negotiated page groups through Cloudflare Workers Assets', () => {
    const routes = createCloudflareModuleWorkerRoutes({
      '/': '/llms.txt',
      '/about': '/raw/about.md',
      '/docs/guide': '/raw/docs/guide.md',
      '/blog/agents': '/raw/blog/agents.md',
    }, ['/api/*'])

    assert.deepEqual(routes, [
      '/api/*',
      '/',
      '/about',
      '/about/*',
      '/docs',
      '/docs/*',
      '/blog',
      '/blog/*',
    ])
    assert.equal(createCloudflareModuleWorkerRoutes({}, true), true)
  })

  it('routes negotiated pages and trailing slashes through Vercel', () => {
    const routes = createVercelNegotiationRoutes({
      '/': '/llms.txt',
      '/guide/v1.0/(intro)': '/raw/guide/v1.0/(intro).md',
    }, '/__fallback')

    assert.equal(routes.length, 6)
    assert.equal(routes[0]?.src, '^/$')
    assert.equal(routes[3]?.src, '^/guide/v1\\.0/\\(intro\\)/?$')
    assert.deepEqual(routes[5], {
      src: '^/guide/v1\\.0/\\(intro\\)/?$',
      headers: {
        link: '</raw/guide/v1.0/(intro).md>; rel="alternate"; type="text/markdown"',
        vary: 'Accept',
      },
      continue: true,
    })
  })

  it('returns Markdown without discarding existing response metadata', async () => {
    const response = withMarkdownHeaders(new Response('# Guide', {
      status: 206,
      headers: { vary: 'Accept-Encoding' },
    }))

    assert.equal(response.status, 206)
    assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8')
    assert.equal(response.headers.get('vary'), 'Accept-Encoding, Accept')
    assert.equal(await response.text(), '# Guide')
  })

  it('preserves existing Accept and wildcard Vary headers', () => {
    assert.equal(withMarkdownHeaders(new Response('', {
      headers: { vary: 'accept, Origin' },
    })).headers.get('vary'), 'accept, Origin')
    assert.equal(withMarkdownHeaders(new Response('', {
      headers: { vary: '*' },
    })).headers.get('vary'), '*')
  })
})
