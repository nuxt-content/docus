import { appendResponseHeader, defineEventHandler, getRequestHeader, getRequestURL, setResponseHeader, setResponseStatus } from 'h3'
import { getMarkdownPath, negotiateContentType, withMarkdownHeaders } from '../utils/markdown-negotiation'

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

  const contentType = negotiateContentType(
    getRequestHeader(event, 'accept'),
    getRequestHeader(event, 'user-agent'),
  )

  if (!contentType) {
    appendResponseHeader(event, 'vary', 'Accept')
    setResponseStatus(event, 406, 'Not Acceptable')
    setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
    return 'Not Acceptable\n\nAvailable: text/html, text/markdown\n'
  }

  if (contentType === 'text/html') {
    appendResponseHeader(event, 'vary', 'Accept')
    appendResponseHeader(event, 'link', `<${markdownPath}>; rel="alternate"; type="text/markdown"`)
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
