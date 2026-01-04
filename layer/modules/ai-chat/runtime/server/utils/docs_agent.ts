import { tool, stepCountIs, generateText } from 'ai'
import { z } from 'zod'

function getSubAgentSystemPrompt(siteName: string) {
  return `You are a documentation search agent for ${siteName}. Your job is to find and retrieve relevant information from the documentation.

**Your task:**
- Use the available tools to search and read documentation pages
- Start with list-pages to discover what documentation exists
- Then use get-page to read the relevant page(s)
- If a specific path is mentioned, you can call get-page directly

**Guidelines:**
- Be thorough - read all relevant pages before answering
- Return the raw information you find, let the main agent format the response
- If you can't find information, say so clearly

**Output:**
Return the relevant documentation content you found, including code examples if present.`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDocumentationAgentTool(mcpTools: Record<string, any>, model: string, siteName: string) {
  return tool({
    description: 'Search and retrieve information from the documentation. Use this tool to answer any question about the documentation. Pass the user\'s question as the query.',
    inputSchema: z.object({
      query: z.string().describe('The question to search for in the documentation'),
    }),
    execute: async ({ query }, executionOptions) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const writer = (executionOptions as any)?.experimental_context?.writer

      const result = await generateText({
        model: model,
        tools: mcpTools,
        system: getSubAgentSystemPrompt(siteName),
        stopWhen: stepCountIs(5),
        onStepFinish: ({ toolCalls }) => {
          writer?.write({
            id: toolCalls[0]?.toolCallId,
            type: 'data-tool-calls',
            data: {
              tools: toolCalls.map(toolCall => ({ toolName: toolCall.toolName, toolCallId: toolCall.toolCallId, input: toolCall.input })),
            },
          })
        },
        prompt: query,
      })

      return result.text
    },
  })
}
