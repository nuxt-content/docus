import { addComponent, addImports, addServerHandler, createResolver, defineNuxtModule, logger } from '@nuxt/kit'

export interface AiChatModuleOptions {
  /**
   * API endpoint path for the chat
   * @default '/api/ai-chat'
   */
  apiPath?: string
  /**
   * MCP server URL or path.
   * - Use a path like '/mcp' to use the built-in Docus MCP server
   * - Use a full URL like 'https://docs.example.com/mcp' for external MCP servers
   * @default '/mcp'
   */
  mcpServer?: string
  /**
   * AI model to use via AI SDK Gateway
   * @default 'moonshotai/kimi-k2-turbo'
   */
  model?: string
}

const log = logger.withTag('docus:ai-assistant')

export default defineNuxtModule<AiChatModuleOptions>({
  meta: {
    name: 'ai-chat',
    configKey: 'aiChat',
  },
  defaults: {
    apiPath: '/api/ai-chat',
    mcpServer: '/mcp',
    model: 'moonshotai/kimi-k2-turbo',
  },
  setup(options, nuxt) {
    const hasApiKey = !!process.env.AI_GATEWAY_API_KEY

    const { resolve } = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.aiChat = {
      enabled: hasApiKey,
      apiPath: options.apiPath!,
    }

    addImports([
      {
        name: 'useAIChat',
        from: resolve('./runtime/composables/useAIChat'),
      },
    ])

    const components = [
      'AiChat',
      'AiChatPanel',
      'AiChatToolCall',
      'AiChatFloatingInput',
      'AiTextShimmer',
    ]

    components.forEach(name =>
      addComponent({
        name,
        filePath: hasApiKey
          ? resolve(`./runtime/components/${name}.vue`)
          : resolve('./runtime/components/AiChatDisabled.vue'),
      }),
    )

    if (!hasApiKey) {
      log.warn('Module disabled: no AI_GATEWAY_API_KEY found')
      return
    }

    nuxt.options.runtimeConfig.aiChat = {
      mcpServer: options.mcpServer!,
      model: options.model!,
    }

    addImports([
      {
        name: 'useHighlighter',
        from: resolve('./runtime/composables/useHighlighter'),
      },
    ])

    const routePath = options.apiPath!.replace(/^\//, '')
    addServerHandler({
      route: `/${routePath}`,
      handler: resolve('./runtime/server/api/search'),
    })
  },
})

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    aiChat: {
      enabled: boolean
      apiPath: string
    }
  }
  interface RuntimeConfig {
    aiChat: {
      mcpServer: string
      model: string
    }
  }
}
