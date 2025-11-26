import { z } from 'zod'

export default defineMcpTool({
  description: 'Lists all documentation pages with titles, paths, and descriptions. ALWAYS call this first to discover available pages before using get-page, unless the user provides a specific path.',
  inputSchema: {
    locale: z.string().optional().describe('The locale to filter pages by'),
  },
  handler: async (params) => {
    const result = await $fetch('/api/.docus-mcp/list-pages', { query: params })
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  },
})
