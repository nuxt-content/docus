import Negotiator from 'negotiator'

export type VercelRoute = {
  handle?: string
  src?: string
  dest?: string
  [key: string]: unknown
}

export function negotiateContentType(accept?: string, userAgent?: string): 'text/html' | 'text/markdown' | undefined {
  const mediaTypes = accept?.split(',').map(range => range.split(';')[0]?.trim().toLowerCase()) || []
  const hasExplicitDocumentType = mediaTypes.some(type => type === 'text/html' || type === 'text/markdown')
  if (/^curl\//i.test(userAgent || '') && (!accept || (mediaTypes.includes('*/*') && !hasExplicitDocumentType))) {
    return 'text/markdown'
  }

  return new Negotiator({ headers: { accept } }).mediaType(['text/html', 'text/markdown']) as 'text/html' | 'text/markdown' | undefined
}

export function createMarkdownRoutes(
  llmsText = '',
  locales: string[] = [],
): Record<string, string> {
  const routes: Record<string, string> = {}
  if (!llmsText) return routes

  routes['/'] = '/llms.txt'
  for (const locale of locales) routes[`/${locale}`] = '/llms.txt'

  for (const [, link] of llmsText.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    try {
      const rawPath = new URL(link!, 'https://docus.local').pathname
      if (!rawPath.startsWith('/raw/') || !rawPath.endsWith('.md')) continue
      const pagePath = rawPath.slice(4, -3).replace(/\/index$/, '') || '/'
      routes[pagePath] = rawPath
    }
    catch {
      // Ignore malformed links in generated or user-authored llms.txt content.
    }
  }

  return routes
}

export function getMarkdownPath(path: string, routes: Record<string, string> = {}): string | undefined {
  return routes[path === '/' ? path : path.replace(/\/+$/, '')]
}

export function getPrerenderedHtmlPaths(routes: Record<string, string> = {}): string[] {
  return Object.keys(routes).flatMap((route) => {
    const path = route === '/' ? 'index' : route.slice(1)
    return [`${path}.html`, `${path}/index.html`]
  })
}

export function createCloudflareModuleWorkerRoutes(
  markdownRoutes: Record<string, string> = {},
  current: boolean | string[] | undefined = [],
): boolean | string[] {
  if (current === true) {
    return true
  }

  const workerRoutes = new Set(Array.isArray(current) ? current : [])
  for (const path of Object.keys(markdownRoutes)) {
    if (path === '/') {
      workerRoutes.add(path)
      continue
    }

    const topLevelPath = `/${path.split('/')[1]}`
    workerRoutes.add(topLevelPath)
    workerRoutes.add(`${topLevelPath}/*`)
  }

  return [...workerRoutes]
}

export function createVercelNegotiationRoutes(
  markdownRoutes: Record<string, string> = {},
  destination = '/__fallback',
): VercelRoute[] {
  return Object.keys(markdownRoutes).flatMap((path) => {
    const src = `^${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${path === '/' ? '' : '/?'}$`

    return [
      {
        src,
        dest: destination,
        has: [{
          type: 'header',
          key: 'accept',
          value: '.*[tT][eE][xX][tT]/[mM][aA][rR][kK][dD][oO][wW][nN].*',
        }],
      },
      {
        src,
        dest: destination,
        has: [{
          type: 'header',
          key: 'user-agent',
          value: '[cC][uU][rR][lL]/.*',
        }],
      },
      {
        src,
        headers: {
          link: `<${markdownRoutes[path]}>; rel="alternate"; type="text/markdown"`,
          vary: 'Accept',
        },
        continue: true,
      },
    ]
  })
}

export function withMarkdownHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  const vary = headers.get('vary')
  headers.set('content-type', 'text/markdown; charset=utf-8')

  if (!vary) {
    headers.set('vary', 'Accept')
  }
  else if (vary !== '*' && !vary.split(',').some(value => value.trim().toLowerCase() === 'accept')) {
    headers.set('vary', `${vary}, Accept`)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
