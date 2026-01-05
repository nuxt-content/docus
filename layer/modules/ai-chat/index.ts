import { addComponent, addImports, addServerHandler, createResolver, defineNuxtModule } from '@nuxt/kit'

export interface AiChatModuleOptions {
  /**
   * API endpoint path for the chat
   * @default '/api/ai-chat'
   */
  apiPath?: string
  /**
   * MCP server path to connect to
   * @default '/mcp'
   */
  mcpPath?: string
  /**
   * AI model to use via AI SDK Gateway
   * @default 'moonshotai/kimi-k2-turbo'
   */
  model?: string
}

export default defineNuxtModule<AiChatModuleOptions>({
  meta: {
    name: 'ai-chat',
    configKey: 'aiChat',
  },
  defaults: {
    apiPath: '/api/ai-chat',
    mcpPath: '/mcp',
    model: 'moonshotai/kimi-k2-turbo',
  },
  setup(options, nuxt) {
    const hasApiKey = !!(
      process.env.AI_GATEWAY_API_KEY
      || process.env.OPENAI_API_KEY
    )

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

    if (!hasApiKey) {
      console.info('[ai-chat] Module disabled: no AI_GATEWAY_API_KEY or OPENAI_API_KEY found')
      return
    }

    nuxt.options.runtimeConfig.aiChat = {
      mcpPath: options.mcpPath!,
      model: options.model!,
    }

    const components = [
      'AiChat',
      'AiChatSlideover',
      'AiChatToolCall',
      'AiChatFloatingInput',
      'AiTextShimmer',
    ]

    components.forEach(name =>
      addComponent({
        name,
        filePath: resolve(`./runtime/components/${name}.vue`),
      }),
    )

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
      mcpPath: string
      model: string
    }
  }
}
