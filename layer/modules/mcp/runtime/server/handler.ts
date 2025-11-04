import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { getAvailableLocales } from './utils'
import type { H3Event } from 'h3'

function createMcpServer(event: H3Event) {
  const runtimeConfig = useRuntimeConfig(event)
  const { name, version } = runtimeConfig.mcp
  const availableLocales = getAvailableLocales(runtimeConfig.public)

  const server = new McpServer({
    name,
    version,
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
      const result = await $fetch('/.docus-mcp/list-pages', { query: params })
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
      const result = await $fetch('/.docus-mcp/get-page', { query: params })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    },
  )

  return server
}

export default defineEventHandler(async (event) => {
  const { redirectTo } = useRuntimeConfig(event).mcp

  if (getHeader(event, 'accept')?.includes('text/html')) {
    return sendRedirect(event, redirectTo)
  }

  const server = createMcpServer(event)
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
