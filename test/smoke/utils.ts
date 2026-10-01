/**
 * Smoke tests run against a live Docus site, local or deployed.
 * - `SMOKE_URL`: site URL, including `app.baseURL` when set.
 * - `SMOKE_TARGET`: `vercel` (default) or `node`.
 * - `VERCEL_AUTOMATION_BYPASS_SECRET`: passes Vercel Deployment Protection on previews.
 * - `SMOKE_ASSISTANT`: `true` to also call the assistant (needs AI Gateway on the deployment).
 */
const rawUrl = process.env.SMOKE_URL
if (!rawUrl) {
  throw new Error('SMOKE_URL is required, e.g. `SMOKE_URL=http://localhost:3000 pnpm test:smoke`')
}

export const siteURL = new URL(rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`)
export const target = process.env.SMOKE_TARGET === 'node' ? 'node' : 'vercel'
export const assistantEnabled = process.env.SMOKE_ASSISTANT === 'true'
export const assistantPath = process.env.SMOKE_ASSISTANT_PATH || '/__docus__/assistant'

const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

/** Resolves a site path against `SMOKE_URL`, keeping its base path. */
export function url(path: string): URL {
  return new URL(path.replace(/^\//, ''), siteURL)
}

export function request(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  if (bypassSecret) headers.set('x-vercel-protection-bypass', bypassSecret)
  if (!headers.has('user-agent')) headers.set('user-agent', 'Mozilla/5.0 (docus-smoke-test)')

  return fetch(url(path), { ...init, headers })
}

export function requestHTML(path: string, init: RequestInit = {}): Promise<Response> {
  return request(path, { ...init, headers: { accept: 'text/html', ...init.headers } })
}

interface MCPResult<T> {
  result?: T
  error?: { message: string }
}

let mcpId = 0

/** Calls the Docus MCP server over streamable HTTP, without a session. */
export async function mcp<T>(method: string, params?: Record<string, unknown>): Promise<T> {
  const res = await request('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'accept': 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++mcpId, method, params }),
  })
  if (!res.ok) throw new Error(`MCP ${method} returned ${res.status}`)

  const text = await res.text()
  // Streamable HTTP may answer with SSE instead of JSON.
  const json = text.startsWith('{') ? text : text.split('\n').find(line => line.startsWith('data: '))?.slice(6)
  const payload = JSON.parse(json || '{}') as MCPResult<T>
  if (payload.error) throw new Error(`MCP ${method} failed: ${payload.error.message}`)
  return payload.result as T
}

export interface DocsPage {
  title: string
  path: string
  locale?: string
}

let pages: Promise<DocsPage[]> | undefined

/** Pages listed by the `list-pages` MCP tool, fetched once per run. */
export function listPages(): Promise<DocsPage[]> {
  pages ||= mcp<{ content: Array<{ text: string }> }>('tools/call', { name: 'list-pages', arguments: {} })
    .then(result => JSON.parse(result.content[0]!.text) as DocsPage[])
  return pages
}
