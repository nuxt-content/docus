import { toUIMessageStream, createUIMessageStreamResponse, isStepCount, smoothStream } from 'ai'
import type { streamText, ToolSet } from 'ai'
import { createMCPClient } from '@ai-sdk/mcp'
import type { H3Event } from 'h3'

type StreamTextOptions = Parameters<typeof streamText>[0]

/** Max model/tool steps before the assistant is forced to produce a final answer. */
const MAX_STEPS = 10

export interface AssistantDefaultOptions {
  /** MCP tools exposed by the configured documentation server. */
  tools: ToolSet
  /** Aborts generation when the client disconnects. */
  abortSignal: AbortSignal
  onEnd: () => void
  onAbort: () => void
  onError: (payload: { error: unknown }) => void
  /** The documentation-tuned prompt, built from the site name. */
  instructions: string
  maxOutputTokens: number
  maxRetries: number
  stopWhen: StreamTextOptions['stopWhen']
  prepareStep: StreamTextOptions['prepareStep']
  experimental_transform: StreamTextOptions['experimental_transform']
}

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

/**
 * Every `streamText` option the built-in assistant endpoint uses.
 */
export async function getAssistantDefaultOptions(event: H3Event): Promise<AssistantDefaultOptions> {
  const config = useRuntimeConfig()

  const mcpServer = config.assistant.mcpServer
  const isExternalUrl = mcpServer.startsWith('http://') || mcpServer.startsWith('https://')
  const baseURL = config.app?.baseURL?.replace(/\/$/, '') || ''

  const abortController = new AbortController()
  event.node.req.on('close', () => abortController.abort())

  let transport: Parameters<typeof createMCPClient>[0]['transport']
  if (isExternalUrl) {
    transport = {
      type: 'http',
      url: mcpServer,
    }
  }
  else if (import.meta.dev) {
    transport = {
      type: 'http',
      url: `${getRequestURL(event).origin}${baseURL}${mcpServer}`,
    }
  }
  else {
    // The internal MCP route is not always reachable over the network in
    // production, so route the request through the event instead.
    transport = {
      type: 'http',
      url: `${getRequestURL(event).origin}${baseURL}${mcpServer}`,
      fetch: createLocalFetch(event),
    }
  }

  const httpClient = await createMCPClient({ transport })
  const tools = await httpClient.tools() as ToolSet

  const close = () => event.waitUntil(httpClient.close())

  return {
    tools,
    abortSignal: abortController.signal,
    onEnd: close,
    onAbort: close,
    onError: ({ error }) => {
      console.error('[docus] assistant error:', error)
      close()
    },
    instructions: getAssistantSystemPrompt(event),
    maxOutputTokens: 8000,
    maxRetries: 2,
    stopWhen: isStepCount(MAX_STEPS),
    prepareStep: ({ stepNumber }) => {
      return stepNumber >= MAX_STEPS - 1 ? { toolChoice: 'none' } : {}
    },
    experimental_transform: smoothStream(),
  }
}

/**
 * Build the default documentation assistant prompt, tuned for the current site.
 */
export function getAssistantSystemPrompt(event: H3Event): string {
  const siteName = getSiteConfig(event).name || 'Documentation'

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
- When it helps, add extra links (related pages, "read more", side topics) — make the answer easy to dig into, not a wall of text
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

/**
 * Wrap a `streamText` result in the response format the assistant UI expects.
 */
export function createAssistantResponse(result: ReturnType<typeof streamText>): Response {
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
