# AI Chat Module

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

1. Copy the `modules/ai-chat` folder to your Nuxt project
2. Install the required dependencies:

```bash
pnpm add @ai-sdk/mcp @ai-sdk/vue @ai-sdk/gateway ai motion-v shiki shiki-stream
```

3. Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['./modules/ai-chat'],

  aiChat: {
    apiPath: '/api/ai-chat',
    mcpPath: '/mcp',
    model: 'moonshotai/kimi-k2-turbo',
  }
})
```

4. Set up your API key as an environment variable:

```bash
# Using AI SDK Gateway
AI_GATEWAY_API_KEY=your-gateway-key

# Or using OpenAI directly
OPENAI_API_KEY=your-openai-key
```

> **Note:** The module will only be enabled if one of these API keys is detected. If no key is found, the module is disabled and a message is logged to the console.

## Usage

Add the components to your app:

```vue
<template>
  <div>
    <!-- Button to open the chat -->
    <AiChat tooltip-text="Ask AI a question" />

    <!-- Chat slideover (place once in your app/layout) -->
    <AiChatSlideover
      title="Ask AI"
      placeholder="Ask a question..."
      :faq-questions="faqQuestions"
    />
  </div>
</template>

<script setup>
const faqQuestions = [
  {
    category: 'Getting Started',
    items: ['How do I install?', 'How do I configure?'],
  },
  {
    category: 'Advanced',
    items: ['How do I customize?'],
  },
]
</script>
```

### Floating Input

Use `AiChatFloatingInput` for a floating input at the bottom of the page.

**Recommended:** Use `Teleport` to render the floating input at the body level, ensuring it stays fixed at the bottom regardless of your component hierarchy:

```vue
<template>
  <div>
    <!-- Teleport to body for proper fixed positioning -->
    <Teleport to="body">
      <ClientOnly>
        <LazyAiChatFloatingInput />
      </ClientOnly>
    </Teleport>

    <!-- Chat slideover (required to display responses) -->
    <AiChatSlideover title="Ask AI" />
  </div>
</template>
```

The floating input:
- Appears at the bottom center of the viewport
- Automatically hides when the chat slideover is open
- Expands on focus for better typing experience
- Supports keyboard shortcuts: `⌘I` to focus, `Escape` to blur

### Programmatic Control

Use the `useAIChat` composable to control the chat:

```vue
<script setup>
const { open, close, toggle, isOpen, messages, clearMessages } = useAIChat()

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
| `apiPath` | `string` | `/api/ai-chat` | API endpoint path for the chat |
| `mcpPath` | `string` | `/mcp` | MCP server path to connect to |
| `model` | `string` | `moonshotai/kimi-k2-turbo` | AI model identifier for AI SDK Gateway |

## Components

### `<AiChat>`

Button to toggle the chat slideover.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tooltipText` | `string` | `Ask AI a question` | Tooltip text on hover |

### `<AiChatSlideover>`

Main chat interface displayed as a slideover panel.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `Ask AI` | Title displayed in the header |
| `placeholder` | `string` | `Ask a question...` | Input placeholder text |
| `faqQuestions` | `FaqCategory[]` | `undefined` | FAQ categories to display when chat is empty |

#### FaqCategory Type

```ts
interface FaqCategory {
  category: string
  items: string[]
}
```

### `<AiChatFloatingInput>`

Floating input field positioned at the bottom of the viewport. No props required.

**Keyboard shortcuts:**
- `⌘I` / `Ctrl+I` - Focus the input
- `Escape` - Blur the input
- `Enter` - Submit the question

### `<AiChatToolCall>`

Displays MCP tool invocations in the chat.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | Required | Label text for the tool call |
| `isLoading` | `boolean` | `false` | Shows loading spinner when true |

## Composables

### `useAIChat`

Main composable for controlling the chat state.

```ts
const {
  isOpen,         // Ref<boolean> - Whether the chat is open
  messages,       // Ref<UIMessage[]> - Chat messages
  pendingMessage, // Ref<string | undefined> - Pending message to send
  open,           // (message?: string, clearPrevious?: boolean) => void
  close,          // () => void
  toggle,         // () => void
  clearMessages,  // () => void
  clearPending,   // () => void
} = useAIChat()
```

### `useHighlighter`

Composable for syntax highlighting code blocks with Shiki.

## Requirements

- Nuxt 4.x
- Nuxt UI 3.x (for `USlideover`, `UButton`, `UTextarea`, `UChatMessages`, etc.)
- An MCP server running (path configurable via `mcpPath`)
- One of the following API keys:
  - `AI_GATEWAY_API_KEY` - AI SDK Gateway key
  - `OPENAI_API_KEY` - OpenAI API key

## Customization

### System Prompt

To customize the AI's behavior, edit the system prompt in:
`runtime/server/api/search.ts`

### Styling

The components use Nuxt UI and Tailwind CSS design tokens. Customize the appearance by modifying the component files or overriding the UI props.

## Dependencies

```json
{
  "@ai-sdk/mcp": "^0.0.8",
  "@ai-sdk/vue": "3.0.0",
  "@ai-sdk/gateway": "^1.0.0",
  "ai": "6.0.0",
  "motion-v": "^1.7.4",
  "shiki": "^3.0.0",
  "shiki-stream": "^0.1.2"
}
```
