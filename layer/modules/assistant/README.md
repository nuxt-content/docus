# Assistant Module

A Nuxt module that provides an AI-powered chat interface using MCP (Model Context Protocol) tools.

## Features

- AI chat slideover component with streaming responses
- Floating input component for quick questions
- MCP tools integration for documentation search
- Syntax highlighting for code blocks
- FAQ suggestions
- Persistent chat state
- Keyboard shortcuts support

## Installation

1. Copy the `modules/assistant` folder to your Nuxt project
2. Install the required dependencies:

```bash
pnpm add @ai-sdk/mcp @ai-sdk/vue @ai-sdk/gateway ai motion-v shiki shiki-stream
```

3. Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['./modules/assistant'],

  docus: {
    assistant: {
      apiPath: '/__docus__/assistant',
      mcpServer: '/mcp',
      model: 'google/gemini-3-flash',
    },
  },
})
```

4. Authenticate to AI Gateway in one of two ways:

   - **`AI_GATEWAY_API_KEY`** — Set it in the Vercel project env UI (and locally in `.env` if you want).
   - **OIDC** — On Vercel, `VERCEL_OIDC_TOKEN` is injected automatically; you do **not** add it (or an API key) in the dashboard. For local builds, run `vercel env pull` on a linked project so `.env` contains the token:

```bash
# Option A — API key (dashboard + optional local .env)
AI_GATEWAY_API_KEY=your-gateway-key

# Option B — local only, after vercel env pull (not set manually on Vercel)
VERCEL_OIDC_TOKEN=...
```

> **Note:** The module enables when `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN` is present at build time. On Vercel, OIDC covers that without you creating env vars in the UI. If neither is available at build, the module stays disabled and a warning is logged.

## Usage

Add the components to your app:

```vue
<template>
  <div>
    <!-- Button to open the chat -->
    <AssistantChat />

    <!-- Chat panel (place once in your app/layout) -->
    <AssistantPanel />
  </div>
</template>
```

### FAQ Questions

Configure FAQ questions in your `app.config.ts`:

```ts
export default defineAppConfig({
  assistant: {
    faqQuestions: [
      {
        category: 'Getting Started',
        items: ['How do I install?', 'How do I configure?'],
      },
      {
        category: 'Advanced',
        items: ['How do I customize?'],
      },
    ],
  },
})
```

You can also use localized FAQ questions:

```ts
export default defineAppConfig({
  assistant: {
    faqQuestions: {
      en: ['How do I install?', 'How do I configure?'],
      fr: ['Comment installer ?', 'Comment configurer ?'],
    },
  },
})
```

### Floating Input

Use `AssistantFloatingInput` for a floating input at the bottom of the page.

**Recommended:** Use `Teleport` to render the floating input at the body level, ensuring it stays fixed at the bottom regardless of your component hierarchy:

```vue
<template>
  <div>
    <!-- Teleport to body for proper fixed positioning -->
    <Teleport to="body">
      <ClientOnly>
        <LazyAssistantFloatingInput />
      </ClientOnly>
    </Teleport>

    <!-- Chat panel (required to display responses) -->
    <AssistantPanel />
  </div>
</template>
```

The floating input:
- Appears at the bottom center of the viewport
- Automatically hides when the chat slideover is open
- Expands on focus for better typing experience
- Supports keyboard shortcuts: `⌘I` to focus, `Escape` to blur

### Programmatic Control

Use the `useAssistant` composable to control the chat:

```vue
<script setup>
const { open, close, toggle, isOpen, messages, clearMessages } = useAssistant()

// Open chat with an initial message
open('How do I install the module?')

// Open and clear previous messages
open('New question', true)

// Toggle chat visibility
toggle()

// Clear all messages
clearMessages()
</script>
```

## Module Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | auto-detected | Force enable or disable the assistant. Defaults to `true` when `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN` is available at build time |
| `apiPath` | `string` | `/__docus__/assistant` | API endpoint path for the chat |
| `mcpServer` | `string` | `/mcp` | MCP server path or full URL (e.g., `https://docs.example.com/mcp` for external servers) |
| `model` | `string` | `google/gemini-3-flash` | AI model identifier for AI SDK Gateway |

## Components

### `<AssistantChat>`

Button to toggle the chat panel. The tooltip text is automatically translated using i18n (`assistant.tooltip`).

### `<AssistantPanel>`

Main chat interface displayed as a side panel. Configuration is done via `app.config.ts` (see FAQ Questions section above).

### `<AssistantFloatingInput>`

Floating input field positioned at the bottom of the viewport. No props required.

**Keyboard shortcuts:**
- `⌘I` / `Ctrl+I` - Focus the input
- `Escape` - Blur the input
- `Enter` - Submit the question

## Composables

### `useAssistant`

Main composable for controlling the chat state.

```ts
const {
  isOpen,         // Ref<boolean> - Whether the chat is open
  messages,       // Ref<UIMessage[]> - Chat messages
  pendingMessage, // Ref<string | undefined> - Pending message to send
  faqQuestions,   // ComputedRef<FaqCategory[]> - FAQ questions from config
  open,           // (message?: string, clearPrevious?: boolean) => void
  close,          // () => void
  toggle,         // () => void
  clearMessages,  // () => void
  clearPending,   // () => void
} = useAssistant()
```

### `useHighlighter`

Composable for syntax highlighting code blocks with Shiki.

## Requirements

- Nuxt 4.x
- Nuxt UI 3.x (for `USlideover`, `UButton`, `UTextarea`, `UChatMessages`, etc.)
- An MCP server running (path configurable via `mcpServer`)
- `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN` at build time, unless you set `enabled: true` and provide your own endpoint

## Customization

### Custom provider or system prompt

The endpoint is not configurable by design. To use another provider or different model parameters, set `enabled: true`, point `apiPath` at your own route, and own the `streamText` call:

```ts
// server/api/assistant.ts
import { streamText, convertToModelMessages } from 'ai'
import { createMistral } from '@ai-sdk/mistral'

const mistral = createMistral()

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  return createAssistantResponse(streamText({
    // Spread first, so your options below win
    ...await getAssistantDefaultOptions(event),
    model: mistral('mistral-large-latest'),
    maxOutputTokens: 4000,
    messages: await convertToModelMessages(messages),
  }))
})
```

Auto-imported server utils, all defined in `runtime/server/utils/assistant.ts`:

| Util | Role |
|------|------|
| `getAssistantDefaultOptions(event)` | Every `streamText` option the built-in endpoint uses: MCP tools, abort signal, client cleanup, `instructions`, `maxOutputTokens`, `maxRetries`, `stopWhen`, `prepareStep`, `smoothStream`. Spread it first |
| `getAssistantSystemPrompt(event)` | The documentation prompt on its own, for extending it by concatenation |
| `createAssistantResponse(result)` | Wraps a `streamText` result in the stream format the UI expects |

`model`, `messages` and provider specific options (`providerOptions`, `temperature`) are excluded, since they don't port across providers.

The built-in endpoint lives in `runtime/server/api/assistant.ts` and is written with these same three utils, so it doubles as the reference implementation to copy.

A working override on a non-Gateway provider lives in `playground/server/api/assistant.ts` (Mistral). Run it with:

```bash
MISTRAL_API_KEY=... pnpm playground:dev
```

A server route you define at `apiPath` always takes precedence over the built-in endpoint.

### Styling

The components use Nuxt UI and Tailwind CSS design tokens. Customize the appearance by modifying the component files or overriding the UI props.
