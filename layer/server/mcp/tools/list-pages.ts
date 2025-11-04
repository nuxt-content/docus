import { z } from 'zod'

export default defineMcpTool({
  name: 'list_pages',
  description: 'Lists all available documentation pages with their titles, paths, and descriptions',
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
