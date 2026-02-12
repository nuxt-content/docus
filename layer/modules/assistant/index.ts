import { addComponent, addImports, addServerHandler, createResolver, defineNuxtModule, logger } from '@nuxt/kit'

export interface AssistantModuleOptions {
  /**
   * API endpoint path for the assistant
   * @default '/__docus__/assistant'
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
   * @default 'google/gemini-3-flash'
   */
  model?: string
}

const log = logger.withTag('Docus')

export default defineNuxtModule<AssistantModuleOptions>({
  meta: {
    name: 'assistant',
    configKey: 'assistant',
  },
  defaults: {
    apiPath: '/__docus__/assistant',
    mcpServer: '/mcp',
    model: 'google/gemini-3-flash',
  },
  setup(options, nuxt) {
    const hasApiKey = !!process.env.AI_GATEWAY_API_KEY

    const { resolve } = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.assistant = {
      enabled: hasApiKey,
      apiPath: options.apiPath!,
    }

    addImports([
      {
        name: 'useAssistant',
        from: resolve('./runtime/composables/useAssistant'),
      },
    ])

    const components = [
      'AssistantChat',
      'AssistantPanel',
      'AssistantFloatingInput',
      'AssistantLoading',
      'AssistantMatrix',
    ]

    components.forEach(name =>
      addComponent({
        name,
        filePath: hasApiKey
          ? resolve(`./runtime/components/${name}.vue`)
          : resolve('./runtime/components/AssistantChatDisabled.vue'),
      }),
    )

    if (!hasApiKey) {
      log.warn('AI assistant disabled: AI_GATEWAY_API_KEY not found')
      return
    }

    nuxt.options.runtimeConfig.assistant = {
      mcpServer: options.mcpServer!,
      model: options.model!,
    }

    const routePath = options.apiPath!.replace(/^\//, '')
    addServerHandler({
      route: `/${routePath}`,
      handler: resolve('./runtime/server/api/search'),
    })
  },
})

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    assistant: {
      enabled: boolean
      apiPath: string
    }
  }
  interface RuntimeConfig {
    assistant: {
      mcpServer: string
      model: string
    }
  }
}
