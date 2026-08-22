import { appendResponseHeader, defineEventHandler, getRequestHeader, getRequestURL } from 'h3'
import { negotiateMarkdown } from '../utils/markdown-negotiation'

type DocusRuntimeConfig = {
  docus?: {
    markdownNegotiation?: {
      routes?: Record<string, string>
    }
  }
}

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event) as ReturnType<typeof useRuntimeConfig> & DocusRuntimeConfig
  const result = await negotiateMarkdown({
    method: event.method,
    path: getRequestURL(event).pathname,
    accept: getRequestHeader(event, 'accept'),
    userAgent: getRequestHeader(event, 'user-agent'),
    routes: runtimeConfig.docus?.markdownNegotiation?.routes,
    fetch: (path, init) => event.fetch(path, init),
  })

  if (result.vary && !result.response) {
    appendResponseHeader(event, 'vary', 'Accept')
  }

  return result.response
})
