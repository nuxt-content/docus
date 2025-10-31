import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { H3Event } from 'h3'

function createServer(event: H3Event) {
  const config = useRuntimeConfig(event).public

  // @ts-expect-error - FIXME: This should be typed
  const siteName = config.site?.name || 'Docus Documentation'
  const availableLocales = getAvailableLocales(config)

  const server = new McpServer({
    name: siteName,
    version: '1.0.0',
  })

  server.tool(
    'list_pages',
    'Lists all available documentation pages with their titles, paths, and descriptions',
    {
      locale: availableLocales.length > 0
        ? z.enum(availableLocales as [string, ...string[]]).optional()
        : z.string().optional(),
    },
    async (params) => {
      const result = await $fetch('/api/mcp/list-pages', { query: params })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.tool(
    'get_page',
    'Retrieves the full markdown content of a specific documentation page by path',
    {
      path: z.string().describe('The page path (e.g., /en/getting-started/installation)'),
    },
    async (params) => {
      const result = await $fetch('/api/mcp/get-page', { query: params })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    },
  )

  return server
}

export default defineEventHandler(async (event) => {
  if (getHeader(event, 'accept')?.includes('text/html')) {
    return sendRedirect(event, '/')
  }

  const server = createServer(event)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })

  event.node.res.on('close', () => {
    transport.close()
    server.close()
  })

  await server.connect(transport)
  const body = await readBody(event)
  await transport.handleRequest(event.node.req, event.node.res, body)
})
