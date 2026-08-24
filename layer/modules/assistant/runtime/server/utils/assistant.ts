import { streamText, convertToModelMessages, isStepCount, smoothStream, toUIMessageStream, createUIMessageStreamResponse } from 'ai'
import type { LanguageModel, ToolSet } from 'ai'
import { createMCPClient } from '@ai-sdk/mcp'
import type { H3Event } from 'h3'

const MAX_STEPS = 10

type StreamTextOptions = Parameters<typeof streamText>[0]
type ProviderOptions = NonNullable<StreamTextOptions['providerOptions']>

export interface AssistantSystemPromptContext {
  /**
   * Site name resolved from the site config, used to personalize the prompt.
   */
  siteName: string
}

export interface AssistantSearchConfig {
  /**
   * Model used to answer the question.
   *
   * Accepts any AI SDK model, which makes it possible to use a provider other
   * than the Vercel AI Gateway (Cloudflare AI Gateway, Mistral, OpenAI, ...).
   *
   * @default runtimeConfig.assistant.model (resolved through the Vercel AI Gateway)
   */
  model?: LanguageModel
  /**
   * System prompt sent to the model.
   *
   * Provide a string to fully replace the default prompt, or a function to
   * build it from the request.
   *
   * @default the built-in Docus documentation assistant prompt
   */
  systemPrompt?: string | ((event: H3Event, context: AssistantSystemPromptContext) => string)
  /**
   * Provider specific options forwarded to `streamText`.
   *
   * Defaults to Vercel AI Gateway automatic caching, and is omitted when a
   * custom `model` is provided.
   */
  providerOptions?: ProviderOptions
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

export function getAssistantSystemPrompt(siteName: string) {
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
 * Handle an assistant chat request.
 *
 * Can be overridden to customize the model, the system prompt or the provider options.
 */
export async function assistantSearchHandler(event: H3Event, searchConfig: AssistantSearchConfig = {}) {
  const { messages } = await readBody(event)
  const config = useRuntimeConfig()
  const siteConfig = getSiteConfig(event)

  const siteName = siteConfig.name || 'Documentation'

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
    transport = {
      type: 'http',
      url: `${getRequestURL(event).origin}${baseURL}${mcpServer}`,
      fetch: createLocalFetch(event),
    }
  }

  const httpClient = await createMCPClient({ transport })
  const mcpTools = await httpClient.tools()

  const closeMcp = () => event.waitUntil(httpClient.close())

  const instructions = typeof searchConfig.systemPrompt === 'function'
    ? searchConfig.systemPrompt(event, { siteName })
    : searchConfig.systemPrompt ?? getAssistantSystemPrompt(siteName)

  // Gateway caching is Vercel AI Gateway specific, so it only applies to the
  // default model resolved from the runtime config.
  const providerOptions = searchConfig.providerOptions
    ?? (searchConfig.model ? undefined : { gateway: { caching: 'auto' } })

  const result = streamText({
    model: searchConfig.model ?? config.assistant.model,
    maxOutputTokens: 8000,
    maxRetries: 2,
    abortSignal: abortController.signal,
    stopWhen: isStepCount(MAX_STEPS),
    // On the last allowed step, disable tools so the model is forced to
    // produce a final text answer instead of stopping mid tool-calling.
    prepareStep: ({ stepNumber }) => {
      return stepNumber >= MAX_STEPS - 1 ? { toolChoice: 'none' } : {}
    },
    providerOptions,
    instructions,
    messages: await convertToModelMessages(messages),
    tools: mcpTools as ToolSet,
    experimental_transform: smoothStream(),
    onEnd: closeMcp,
    onAbort: closeMcp,
    onError: closeMcp,
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
