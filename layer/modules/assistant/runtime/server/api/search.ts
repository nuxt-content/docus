import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import type { UIMessageStreamWriter, ToolCallPart, ToolSet } from 'ai'
import { createMCPClient } from '@ai-sdk/mcp'
import { useLogger, createError } from 'evlog'
import { createAILogger, createEvlogIntegration } from 'evlog/ai'
import type { H3Event } from 'h3'

const MAX_STEPS = 10

function createLocalFetch(event: H3Event): typeof fetch {
  const origin = getRequestURL(event).origin

  return (input, init) => {
    const requestUrl = input instanceof URL
      ? input
      : typeof input === 'string'
        ? new URL(input, origin)
        : new URL(input.url)
    const localPath = requestUrl.origin === origin
      ? `${requestUrl.pathname}${requestUrl.search}`
      : requestUrl.toString()

    return event.fetch(localPath, init)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stopWhenResponseComplete({ steps }: { steps: any[] }): boolean {
  const lastStep = steps.at(-1)
  if (!lastStep) return false

  const hasText = Boolean(lastStep.text && lastStep.text.trim().length > 0)
  const hasNoToolCalls = !lastStep.toolCalls || lastStep.toolCalls.length === 0

  if (hasText && hasNoToolCalls) return true

  return steps.length >= MAX_STEPS
}

function getSystemPrompt(siteName: string) {
  return `You are the documentation assistant for ${siteName}. Help users navigate and understand the project documentation.

**Your identity:**
- You are an assistant helping users with ${siteName} documentation
- NEVER use first person ("I", "me", "my") - always refer to the project by name: "${siteName} provides...", "${siteName} supports...", "The project offers..."
- Be confident and knowledgeable about the project
- Speak as a helpful guide, not as the documentation itself

**Tool usage (CRITICAL):**
- You have tools: list-pages (discover pages) and get-page (read a page)
- If a page title clearly matches the question, read it directly without listing first
- ALWAYS respond with text after using tools - never end with just tool calls

**Guidelines:**
- If you can't find something, say "There is no documentation on that yet" or "${siteName} doesn't cover that topic yet"
- Be concise, helpful, and direct
- Guide users like a friendly expert would

**Links and exploration:**
- Tool results include a \`url\` for each page — prefer markdown links \`[label](url)\` so users can open the doc in one click
- When it helps, add extra links (related pages, “read more”, side topics) — make the answer easy to dig into, not a wall of text
- Stick to URLs from tool results (\`url\` / \`path\`) so links stay valid

**FORMATTING RULES (CRITICAL):**
- NEVER use markdown headings (#, ##, ###, etc.)
- Use **bold text** for emphasis and section labels
- Start responses with content directly, never with a heading
- Use bullet points for lists
- Keep code examples focused and minimal

**Response style:**
- Conversational but professional
- "Here's how you can do that:" instead of "The documentation shows:"
- "${siteName} supports TypeScript out of the box" instead of "I support TypeScript"
- Provide actionable guidance, not just information dumps`
}

export default defineEventHandler(async (event) => {
  const log = useLogger(event)
  const ai = createAILogger(log, {
    toolInputs: { maxLength: 200 },
  })

  const { messages } = await readBody(event)
  const config = useRuntimeConfig()
  const siteConfig = getSiteConfig(event)

  const siteName = siteConfig.name || 'Documentation'

  const mcpServer = config.assistant.mcpServer
  const isExternalUrl = mcpServer.startsWith('http://') || mcpServer.startsWith('https://')
  const baseURL = config.app?.baseURL?.replace(/\/$/, '') || ''

  log.set({
    assistant: {
      mcpServer,
      messageCount: Array.isArray(messages) ? messages.length : 0,
    },
  })

  let transport: Parameters<typeof createMCPClient>[0]['transport']
  if (isExternalUrl) {
    transport = { type: 'http', url: mcpServer }
  }
  else if (import.meta.dev) {
    transport = { type: 'http', url: `http://localhost:3000${baseURL}${mcpServer}` }
  }
  else {
    transport = {
      type: 'http',
      url: `${getRequestURL(event).origin}${baseURL}${mcpServer}`,
      fetch: createLocalFetch(event),
    }
  }

  let httpClient: Awaited<ReturnType<typeof createMCPClient>>
  try {
    httpClient = await createMCPClient({ transport })
  }
  catch (error) {
    throw createError({
      message: 'Failed to connect to MCP server',
      status: 502,
      why: `MCP transport for "${mcpServer}" rejected the handshake`,
      fix: 'Verify the MCP endpoint is reachable and supports the streamable HTTP transport',
      cause: error as Error,
    })
  }

  let mcpTools: Awaited<ReturnType<typeof httpClient.tools>>
  try {
    mcpTools = await httpClient.tools()
  }
  catch (error) {
    await httpClient.close()
    throw createError({
      message: 'Failed to load MCP tools',
      status: 502,
      why: 'MCP server returned an error during tools/list',
      fix: 'Check that the MCP server is healthy and exposes the tools/list method',
      cause: error as Error,
    })
  }

  log.set({ assistant: { tools: Object.keys(mcpTools) } })

  const stream = createUIMessageStream({
    execute: async ({ writer }: { writer: UIMessageStreamWriter }) => {
      const modelMessages = await convertToModelMessages(messages)
      const result = streamText({
        model: ai.wrap(config.assistant.model),
        maxOutputTokens: 4000,
        maxRetries: 2,
        stopWhen: stopWhenResponseComplete,
        system: getSystemPrompt(siteName),
        messages: modelMessages,
        tools: mcpTools as ToolSet,
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'docus.assistant',
          metadata: {
            mcpServer,
            messageCount: Array.isArray(messages) ? messages.length : 0,
          },
          integrations: [createEvlogIntegration(ai)],
        },
        onStepFinish: ({ toolCalls }: { toolCalls: ToolCallPart[] }) => {
          if (toolCalls.length === 0) return
          writer.write({
            id: toolCalls[0]?.toolCallId,
            type: 'data-tool-calls',
            data: {
              tools: toolCalls.map((tc: ToolCallPart) => {
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
        onError: ({ error }) => {
          log.error(error as Error)
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
