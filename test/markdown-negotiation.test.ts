import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  acceptsMarkdown,
  createMarkdownRoutes,
  createVercelNegotiationRoutes,
  getMarkdownPath,
  negotiateMarkdown,
  withoutNegotiatedRoutes,
  wantsMarkdown,
  withMarkdownHeaders,
  withVaryHeader,
} from '../layer/modules/runtime/server/utils/markdown-negotiation.ts'

describe('Accept header parsing', () => {
  it('accepts Markdown media ranges and parameters', () => {
    assert.equal(acceptsMarkdown('text/markdown'), true)
    assert.equal(acceptsMarkdown('text/html, text/markdown; charset=utf-8; q=0.5'), true)
    assert.equal(acceptsMarkdown('TEXT/MARKDOWN;Q="0.8"'), true)
  })

  it('rejects disabled, wildcard, and non-Markdown media ranges', () => {
    assert.equal(acceptsMarkdown('text/markdown;q=0'), false)
    assert.equal(acceptsMarkdown('text/markdown; q=0.000, text/html'), false)
    assert.equal(acceptsMarkdown('text/*, */*'), false)
    assert.equal(acceptsMarkdown('application/json, text/html'), false)
    assert.equal(acceptsMarkdown('text/markdown;q=invalid'), false)
  })

  it('uses the accepted Markdown range when the header contains duplicates', () => {
    assert.equal(acceptsMarkdown('text/markdown;q=0, text/markdown;q=0.2'), true)
  })

  it('keeps curl compatibility without overriding an explicit preference', () => {
    assert.equal(wantsMarkdown('*/*', 'curl/8.7.1'), true)
    assert.equal(wantsMarkdown(undefined, 'curl/8.7.1'), true)
    assert.equal(wantsMarkdown('text/markdown;q=0', 'curl/8.7.1'), false)
    assert.equal(wantsMarkdown('text/html', 'curl/8.7.1'), false)
    assert.equal(wantsMarkdown('*/*', 'Mozilla/5.0'), false)
  })
})

describe('Markdown route mapping', () => {
  const routes = createMarkdownRoutes([
    '/llms.txt',
    '/en/guide/getting-started',
    '/raw/en/guide/getting-started.md',
    '/fr/guide/getting-started',
    '/raw/fr/guide/getting-started.md',
    '/raw/orphaned.md',
    '/does-not-exist',
  ], ['en', 'fr'])

  it('maps root, locale homepages, and generated documentation pages', () => {
    assert.equal(getMarkdownPath('/', routes), '/llms.txt')
    assert.equal(getMarkdownPath('/en', routes), '/llms.txt')
    assert.equal(getMarkdownPath('/fr', routes), '/llms.txt')
    assert.equal(getMarkdownPath('/en/guide/getting-started', routes), '/raw/en/guide/getting-started.md')
  })

  it('does not map missing, raw, or text routes', () => {
    assert.equal(getMarkdownPath('/does-not-exist', routes), undefined)
    assert.equal(getMarkdownPath('/raw/en/guide/getting-started.md', routes), undefined)
    assert.equal(getMarkdownPath('/llms.txt', routes), undefined)
    assert.equal(getMarkdownPath('/orphaned', routes), undefined)
  })

  it('omits root and locale routes when llms.txt was not generated', () => {
    const routesWithoutLlms = createMarkdownRoutes(['/guide', '/raw/guide.md'], ['en'])

    assert.equal(getMarkdownPath('/', routesWithoutLlms), undefined)
    assert.equal(getMarkdownPath('/en', routesWithoutLlms), undefined)
    assert.equal(getMarkdownPath('/guide', routesWithoutLlms), '/raw/guide.md')
  })

  it('keeps negotiated pages in the Cloudflare Pages worker routes', () => {
    assert.deepEqual(withoutNegotiatedRoutes([
      '/_nuxt/*',
      '/en',
      '/en/guide/getting-started',
      '/raw/en/guide/getting-started.md',
    ], routes), [
      '/_nuxt/*',
      '/raw/en/guide/getting-started.md',
    ])
  })

  it('routes exact negotiated pages through the Vercel function', () => {
    const routes = createVercelNegotiationRoutes({
      '/': '/llms.txt',
      '/guide/v1.0/(intro)': '/raw/guide/v1.0/(intro).md',
    }, '/__fallback')

    assert.equal(routes.length, 6)
    assert.deepEqual(routes[0], {
      src: '^/$',
      dest: '/__fallback',
      has: [{
        type: 'header',
        key: 'accept',
        value: '.*[tT][eE][xX][tT]/[mM][aA][rR][kK][dD][oO][wW][nN].*',
      }],
    })
    assert.deepEqual(routes[2], {
      src: '^/$',
      headers: { vary: 'Accept' },
      continue: true,
    })
    assert.equal(routes[3]?.src, '^/guide/v1\\.0/\\(intro\\)$')
  })
})

describe('Markdown response headers', () => {
  it('sets the Markdown content type and adds Accept to Vary', async () => {
    const response = withMarkdownHeaders(new Response('# Guide', {
      headers: { vary: 'Accept-Encoding' },
    }))

    assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8')
    assert.equal(response.headers.get('vary'), 'Accept-Encoding, Accept')
    assert.equal(await response.text(), '# Guide')
  })

  it('does not duplicate or replace an existing Vary value', () => {
    const existing = withMarkdownHeaders(new Response('', { headers: { vary: 'accept, Origin' } }))
    const wildcard = withMarkdownHeaders(new Response('', { headers: { vary: '*' } }))

    assert.equal(existing.headers.get('vary'), 'accept, Origin')
    assert.equal(wildcard.headers.get('vary'), '*')
  })

  it('adds Accept to HTML responses without changing their content type', () => {
    const response = withVaryHeader(new Response('<!DOCTYPE html>', {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'vary': 'Accept-Encoding',
      },
    }))

    assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8')
    assert.equal(response.headers.get('vary'), 'Accept-Encoding, Accept')
  })
})

describe('Markdown negotiation', () => {
  it('serves the raw representation through the Nitro runtime', async () => {
    const requests: Array<{ path: string, init: RequestInit }> = []
    const result = await negotiateMarkdown({
      method: 'GET',
      path: '/en/guide',
      accept: 'text/html, text/markdown; q=0.8',
      routes: { '/en/guide': '/raw/en/guide.md' },
      fetch: async (path, init) => {
        requests.push({ path, init })
        return new Response('# Guide', {
          headers: { vary: 'Accept-Encoding' },
        })
      },
    })

    assert.deepEqual(requests, [{
      path: '/raw/en/guide.md',
      init: { method: 'GET', headers: { accept: '*/*' } },
    }])
    assert.equal(result.vary, true)
    assert.equal(result.response?.status, 200)
    assert.equal(result.response?.headers.get('content-type'), 'text/markdown; charset=utf-8')
    assert.equal(result.response?.headers.get('vary'), 'Accept-Encoding, Accept')
    assert.equal(await result.response?.text(), '# Guide')
  })
})

describe('negotiation fallback', () => {
  it('leaves HTML requests untouched while marking the response as varying on Accept', async () => {
    let fetched = false
    const result = await negotiateMarkdown({
      method: 'GET',
      path: '/en/guide',
      accept: 'text/html',
      routes: { '/en/guide': '/raw/en/guide.md' },
      fetch: async () => {
        fetched = true
        return new Response()
      },
    })

    assert.equal(fetched, false)
    assert.deepEqual(result, { vary: true })
  })

  it('falls through when the raw page is missing so the original status is preserved', async () => {
    const result = await negotiateMarkdown({
      method: 'GET',
      path: '/does-not-exist',
      accept: 'text/markdown',
      routes: { '/does-not-exist': '/raw/does-not-exist.md' },
      fetch: async () => new Response('Not found', { status: 404 }),
    })

    assert.deepEqual(result, { vary: true })
  })

  it('does not negotiate methods that cannot retrieve a representation', async () => {
    const result = await negotiateMarkdown({
      method: 'POST',
      path: '/en/guide',
      accept: 'text/markdown',
      fetch: async () => new Response('# Guide'),
    })

    assert.deepEqual(result, { vary: false })
  })
})
