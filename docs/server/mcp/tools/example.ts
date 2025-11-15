import { z } from 'zod'

// delete this file before merging
export default defineMcpTool({
  name: 'example_tool',
  description: 'An example custom tool to test auto-detection',
  paramsSchema: {
    message: z.string().describe('A message to echo back'),
  },
  handler: async (params) => {
    return {
      content: [
        {
          type: 'text',
          text: `Echo: ${params.message}`,
        },
      ],
    }
  },
})
