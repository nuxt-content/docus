export type MarkdownNegotiationRequest = {
  method: string
  path: string
  accept?: string
  userAgent?: string
  routes?: Record<string, string>
  fetch: (path: string, init: RequestInit) => Promise<Response>
}

export type MarkdownNegotiationResult = {
  vary: boolean
  response?: Response
}

export type VercelRoute = {
  handle?: string
  src?: string
  dest?: string
  [key: string]: unknown
}

type MarkdownPreference = {
  present: boolean
  accepted: boolean
}

function getMarkdownPreference(accept?: string): MarkdownPreference {
  if (!accept) {
    return { present: false, accepted: false }
  }

  let present = false
  let accepted = false

  for (const range of accept.split(',')) {
    const [type, ...parameters] = range.split(';')
    if (type?.trim().toLowerCase() !== 'text/markdown') {
      continue
    }

    present = true
    let quality = 1

    for (const parameter of parameters) {
      const match = parameter.match(/^\s*q\s*=\s*(?:"([^"]*)"|([^\s;]+))\s*$/i)
      if (!match) {
        continue
      }

      const value = Number(match[1] ?? match[2])
      quality = Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0
      break
    }

    if (quality > 0) {
      accepted = true
    }
  }

  return { present, accepted }
}

export function acceptsMarkdown(accept?: string): boolean {
  return getMarkdownPreference(accept).accepted
}

export function wantsMarkdown(accept?: string, userAgent?: string): boolean {
  const preference = getMarkdownPreference(accept)
  if (preference.present) {
    return preference.accepted
  }

  const isCurl = /^curl\//i.test(userAgent || '')
  const acceptsAnything = !accept || accept.trim() === '*/*'
  return isCurl && acceptsAnything
}

export function createMarkdownRoutes(prerenderedRoutes: string[], locales: string[] = []): Record<string, string> {
  const routes: Record<string, string> = {}
  const prerenderedRouteSet = new Set(prerenderedRoutes)

  for (const route of prerenderedRoutes) {
    if (!route.startsWith('/raw/') || !route.endsWith('.md')) {
      continue
    }

    const pagePath = route.replace(/^\/raw/, '').replace(/\.md$/, '')
    if (prerenderedRouteSet.has(pagePath)) {
      routes[pagePath] = route
    }
  }

  if (prerenderedRouteSet.has('/llms.txt')) {
    routes['/'] = '/llms.txt'
    for (const locale of locales) {
      routes[`/${locale}`] = '/llms.txt'
    }
  }

  return routes
}

export function getMarkdownPath(path: string, routes: Record<string, string> = {}): string | undefined {
  return routes[path]
}

export function withoutNegotiatedRoutes(
  excludedRoutes: string[] = [],
  markdownRoutes: Record<string, string> = {},
): string[] {
  const negotiatedRoutes = new Set(Object.keys(markdownRoutes))
  return excludedRoutes.filter(route => !negotiatedRoutes.has(route))
}

export function createCloudflareModuleWorkerRoutes(
  markdownRoutes: Record<string, string> = {},
  current: boolean | string[] | undefined = [],
): boolean | string[] {
  if (current === true) {
    return true
  }

  const workerRoutes = new Set(Array.isArray(current) ? current : [])
  const topLevelRoutes = new Map<string, boolean>()

  for (const path of Object.keys(markdownRoutes)) {
    if (path === '/') {
      workerRoutes.add(path)
      continue
    }

    const segments = path.split('/').filter(Boolean)
    const topLevelPath = `/${segments[0]}`
    topLevelRoutes.set(topLevelPath, (topLevelRoutes.get(topLevelPath) || false) || segments.length > 1)
  }

  for (const [path, hasChildren] of topLevelRoutes) {
    workerRoutes.add(path)
    if (hasChildren) {
      workerRoutes.add(`${path}/*`)
    }
  }

  return [...workerRoutes]
}

export function createVercelNegotiationRoutes(
  markdownRoutes: Record<string, string> = {},
  destination = '/__fallback',
): VercelRoute[] {
  return Object.keys(markdownRoutes).flatMap((path) => {
    const src = `^${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`

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
  headers.set('content-type', 'text/markdown; charset=utf-8')

  return withVaryHeader(new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  }))
}

export function withVaryHeader(response: Response): Response {
  const headers = new Headers(response.headers)
  const vary = headers.get('vary')

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

export async function negotiateMarkdown(request: MarkdownNegotiationRequest): Promise<MarkdownNegotiationResult> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return { vary: false }
  }

  const markdownPath = getMarkdownPath(request.path, request.routes)
  if (!markdownPath) {
    return { vary: false }
  }

  if (!wantsMarkdown(request.accept, request.userAgent)) {
    return { vary: true }
  }

  try {
    const response = await request.fetch(markdownPath, {
      method: request.method,
      headers: { accept: '*/*' },
    })

    if (!response.ok) {
      return { vary: true }
    }

    return {
      vary: true,
      response: withMarkdownHeaders(response),
    }
  }
  catch {
    return { vary: true }
  }
}
