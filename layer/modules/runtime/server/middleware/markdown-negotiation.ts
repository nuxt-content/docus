import { appendResponseHeader, defineEventHandler, getRequestHeader, getRequestURL } from 'h3'
import { getMarkdownPath, wantsMarkdown, withMarkdownHeaders } from '../utils/markdown-negotiation'

type DocusRuntimeConfig = {
  docus?: {
    markdownNegotiation?: {
      routes?: Record<string, string>
    }
  }
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  const runtimeConfig = useRuntimeConfig(event) as ReturnType<typeof useRuntimeConfig> & DocusRuntimeConfig
  const markdownPath = getMarkdownPath(
    getRequestURL(event).pathname,
    runtimeConfig.docus?.markdownNegotiation?.routes,
  )
  if (!markdownPath) return

  if (!wantsMarkdown(getRequestHeader(event, 'accept'), getRequestHeader(event, 'user-agent'))) {
    appendResponseHeader(event, 'vary', 'Accept')
    return
  }

  try {
    const response = await event.fetch(markdownPath, { method: 'GET', headers: { accept: '*/*' } })
    if (response.ok) return withMarkdownHeaders(response)
  }
  catch {
    // Fall through to the original route.
  }

  appendResponseHeader(event, 'vary', 'Accept')
})
