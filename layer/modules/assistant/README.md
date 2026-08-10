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
pnpm add @ai-sdk/mcp @ai-sdk/vue @ai-sdk/gateway ai ai-gateway-provider motion-v shiki shiki-stream
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

4. Choose an AI Gateway provider and authenticate it:

  **Vercel AI Gateway (default)**

   - **`AI_GATEWAY_API_KEY`** — Set it in the Vercel project env UI (and locally in `.env` if you want).
   - **OIDC** — On Vercel, `VERCEL_OIDC_TOKEN` is injected automatically; you do **not** add it (or an API key) in the dashboard. For local builds, run `vercel env pull` on a linked project so `.env` contains the token:

```bash
# Option A — API key (dashboard + optional local .env)
AI_GATEWAY_API_KEY=your-gateway-key

# Option B — local only, after vercel env pull (not set manually on Vercel)
VERCEL_OIDC_TOKEN=...
```

   **Cloudflare AI Gateway**

   Configure the provider in `nuxt.config.ts`:

```ts
docus: {
  assistant: {
    provider: 'cloudflare',
    cloudflare: {
      gateway: 'default',
    },
  },
}
```

  Set these variables at runtime:

  - **`NUXT_ASSISTANT_CLOUDFLARE_ACCOUNT_ID`** — Cloudflare account ID.
  - **`NUXT_ASSISTANT_CLOUDFLARE_AI_GATEWAY_ID`** — Cloudflare AI Gateway ID.
  - **`NUXT_ASSISTANT_CLOUDFLARE_AIG_TOKEN`** — Cloudflare AI Gateway token.

  Cloudflare BYOK or Unified Billing can provide upstream provider authentication, but the gateway token is still required when gateway authentication is enabled.

> **Note:** The module enables when the selected provider has its required configuration at build time. If it is not configured, the assistant stays disabled and a warning is logged.

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
| `apiPath` | `string` | `/__docus__/assistant` | API endpoint path for the chat |
| `mcpServer` | `string` | `/mcp` | MCP server path or full URL (e.g., `https://docs.example.com/mcp` for external servers) |
| `provider` | `'vercel' \| 'cloudflare'` | `vercel` | AI Gateway provider to use |
| `cloudflare` | `object` | `{}` | Cloudflare account and gateway settings; used when `provider` is `cloudflare` |
| `model` | `string` | `google/gemini-3-flash` (Vercel) / `workers-ai/@cf/zai-org/glm-4.7-flash` (Cloudflare) | AI model identifier for the selected gateway |

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
- Credentials for the selected AI Gateway provider at build time

## Customization

### System Prompt

To customize the AI's behavior, edit the system prompt in:
`runtime/server/api/search.ts`

### Styling

The components use Nuxt UI and Tailwind CSS design tokens. Customize the appearance by modifying the component files or overriding the UI props.
