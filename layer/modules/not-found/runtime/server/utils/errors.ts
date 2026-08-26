import { appendResponseHeader, send, setResponseHeader, setResponseStatus } from 'h3'
import type { NitroErrorHandler } from 'nitropack/types'
import { buildNotFoundMarkdown, requestPath, wantsAsset, wantsHtml, wantsJson } from './not-found'
import type { NotFoundLink } from './not-found'
import { useRuntimeConfig } from '#imports'

interface NotFoundRuntimeConfig {
  links?: NotFoundLink[]
}

/**
 * Answer agent 404s with markdown pointing at the site's machine-readable
 * entry points, instead of Nitro's JSON error body.
 */
const notFoundMarkdownHandler: NitroErrorHandler = async (error, event, { defaultHandler }) => {
  if (event.handled) return
  if ((error.statusCode || 500) !== 404) return
  if (wantsHtml(event) || wantsJson(event) || wantsAsset(event)) return

  const config = useRuntimeConfig(event)

  // Fall back to the default handler, which will return a JSON error body.
  const fallback = await defaultHandler(error, event, { json: true })
  if (fallback.status === 302) return

  const baseURL = config.app?.baseURL || '/'
  const { links } = (config.notFound || {}) as NotFoundRuntimeConfig

  // Keep a route's own status text ("Article not found"), which beats "Not Found".
  setResponseStatus(event, 404, error.statusMessage || 'Not Found')
  setResponseHeader(event, 'content-type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'no-cache')
  setResponseHeader(event, 'x-content-type-options', 'nosniff')
  // Append the `Accept` header to the `Vary` header, so CDNs don't mix up the markdown and HTML variants.
  appendResponseHeader(event, 'vary', 'Accept')

  return send(
    event,
    buildNotFoundMarkdown({
      path: requestPath(event, baseURL),
      baseURL,
      links,
      message: error.message,
    }),
  )
}

export default notFoundMarkdownHandler
