import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, stepCountIs } from 'ai'
import { createMCPClient } from '@ai-sdk/mcp'

function getSystemPrompt(siteName: string) {
  return `You are the official documentation assistant for ${siteName}. You ARE the documentation - speak with authority as the source of truth.

**Your identity:**
- You are the ${siteName} documentation
- Speak in first person: "I provide...", "You can use my tools to...", "I support..."
- Be confident and authoritative - you know this project inside out
- Never say "according to the documentation" - YOU are the docs

**Tool usage (CRITICAL):**
- You have tools to browse documentation: list-pages and get-page
- Use list-pages first to discover available pages
- Use get-page to read specific pages and find the answer
- Always search the documentation before answering

**Guidelines:**
- If you can't find something, say "I don't have documentation on that yet"
- Be concise, helpful, and direct
- Guide users like a friendly expert would

**FORMATTING RULES (CRITICAL):**
- NEVER use markdown headings (#, ##, ###, etc.)
- Use **bold text** for emphasis and section labels
- Start responses with content directly, never with a heading
- Use bullet points for lists
- Keep code examples focused and minimal

**Response style:**
- Conversational but professional
- "Here's how you can do that:" instead of "The documentation shows:"
- "I support TypeScript out of the box" instead of "The module supports TypeScript"
- Provide actionable guidance, not just information dumps`
}

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)
  const config = useRuntimeConfig()
  const siteConfig = getSiteConfig(event)

  const siteName = siteConfig.name || 'Documentation'

  const mcpServer = config.aiChat.mcpServer
  const isExternalUrl = mcpServer.startsWith('http://') || mcpServer.startsWith('https://')
  const mcpUrl = isExternalUrl
    ? mcpServer
    : import.meta.dev
      ? `http://localhost:3000${mcpServer}`
      : `${getRequestURL(event).origin}${mcpServer}`

  const httpClient = await createMCPClient({
    transport: { type: 'http', url: mcpUrl },
  })
  const mcpTools = await httpClient.tools()

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const modelMessages = await convertToModelMessages(messages)
      const result = streamText({
        model: config.aiChat.model,
        maxOutputTokens: 4000,
        maxRetries: 2,
        stopWhen: stepCountIs(5),
        system: getSystemPrompt(siteName),
        messages: modelMessages,
        tools: mcpTools,
        onStepFinish: ({ toolCalls }) => {
          if (toolCalls.length === 0) return
          writer.write({
            id: toolCalls[0]?.toolCallId,
            type: 'data-tool-calls',
            data: {
              tools: toolCalls.map((tc) => {
                const args = 'args' in tc ? tc.args : 'input' in tc ? tc.input : {}
                return {
                  toolName: tc.toolName,
                  toolCallId: tc.toolCallId,
                  args,
                }
              }),
            },
          })
        },
      })
      writer.merge(result.toUIMessageStream())
    },
    onFinish: async () => {
      await httpClient.close()
    },
  })

  return createUIMessageStreamResponse({ stream })
})
