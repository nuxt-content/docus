import { z } from 'zod'

export default defineMcpTool({
  description: 'Retrieves the full markdown content of a documentation page. Use this after list-pages to read specific pages, or directly if the user provides a path.',
  inputSchema: {
    path: z.string().describe('The page path from list-pages or provided by the user (e.g., /en/getting-started/installation)'),
  },
  handler: async (params) => {
    const result = await $fetch('/api/.docus-mcp/get-page', { query: params })
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  },
})
