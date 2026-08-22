export type VercelRoute = {
  handle?: string
  src?: string
  dest?: string
  [key: string]: unknown
}

function markdownPreference(accept?: string): boolean | undefined {
  let found = false

  for (const range of accept?.split(',') || []) {
    const [type, ...parameters] = range.split(';')
    if (type?.trim().toLowerCase() !== 'text/markdown') {
      continue
    }

    found = true
    const quality = parameters.find(parameter => /^\s*q\s*=/i.test(parameter))
    if (!quality) {
      return true
    }

    const value = Number(quality.slice(quality.indexOf('=') + 1).trim().replace(/^"|"$/g, ''))
    if (value > 0 && value <= 1) return true
  }

  return found ? false : undefined
}

export function wantsMarkdown(accept?: string, userAgent?: string): boolean {
  const preference = markdownPreference(accept)
  return preference ?? (/^curl\//i.test(userAgent || '') && (!accept || accept.trim() === '*/*'))
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
      routes[rawPath.slice(4, -3)] = rawPath
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
        headers: { vary: 'Accept' },
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
