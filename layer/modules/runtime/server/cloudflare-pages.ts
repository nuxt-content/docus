import { useRuntimeConfig } from 'nitropack/runtime'
import { getMarkdownPath, wantsMarkdown, withMarkdownHeaders, withVaryHeader } from './utils/markdown-negotiation'

type CloudflarePagesEnvironment = {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>
  }
}

type CloudflarePagesHandler = {
  fetch: (request: Request, environment: CloudflarePagesEnvironment, context: unknown) => Promise<Response>
  [key: string]: unknown
}

type DocusRuntimeConfig = {
  docus?: {
    markdownNegotiation?: {
      routes?: Record<string, string>
    }
  }
}

export function createCloudflarePagesHandler<T extends CloudflarePagesHandler>(handler: T): T {
  return {
    ...handler,
    async fetch(request, environment, context) {
      const runtimeConfig = useRuntimeConfig() as ReturnType<typeof useRuntimeConfig> & DocusRuntimeConfig
      const path = new URL(request.url).pathname
      const markdownPath = getMarkdownPath(path, runtimeConfig.docus?.markdownNegotiation?.routes)
      const canNegotiate = (request.method === 'GET' || request.method === 'HEAD') && !!markdownPath

      if (canNegotiate && environment.ASSETS) {
        if (wantsMarkdown(
          request.headers.get('accept') || undefined,
          request.headers.get('user-agent') || undefined,
        )) {
          const markdownURL = new URL(markdownPath, request.url)
          const markdownHeaders = new Headers(request.headers)
          markdownHeaders.set('accept', '*/*')
          const markdownRequest = new Request(markdownURL, {
            method: request.method,
            headers: markdownHeaders,
          })
          const response = await environment.ASSETS.fetch(markdownRequest)

          if (response.ok) {
            return withMarkdownHeaders(response)
          }
        }

        const htmlPath = path === '/' ? '/index.html' : `${path}.html`
        const htmlURL = new URL(htmlPath, request.url)
        const htmlHeaders = new Headers(request.headers)
        htmlHeaders.set('accept', 'text/html')
        const response = await environment.ASSETS.fetch(new Request(htmlURL, {
          method: request.method,
          headers: htmlHeaders,
        }))

        if (response.ok) {
          return withVaryHeader(response)
        }
      }

      const response = await handler.fetch(request, environment, context)
      return canNegotiate ? withVaryHeader(response) : response
    },
  } as T
}
