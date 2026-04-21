import { addComponent, addImports, addServerHandler, createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { defu } from 'defu'

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

const defaults: Required<AssistantModuleOptions> = {
  apiPath: '/__docus__/assistant',
  mcpServer: '/mcp',
  model: 'google/gemini-3-flash',
}

export default defineNuxtModule<AssistantModuleOptions>({
  meta: {
    name: 'assistant',
  },
  moduleDependencies: {
    '@comark/nuxt': {
      optional: true,
    },
  },
  setup(_options, nuxt) {
    const legacyOptions = nuxt.options.assistant
    if (legacyOptions && Object.keys(legacyOptions).length > 0) {
      log.warn('`assistant` top-level config is deprecated. Move it under `docus.assistant` in nuxt.config.ts')
    }

    const options = defu(nuxt.options.docus?.assistant, legacyOptions, defaults) as Required<AssistantModuleOptions>

    const hasAiGatewayAuth = !!(
      process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
    )

    const { resolve } = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.assistant = {
      enabled: hasAiGatewayAuth,
      apiPath: options.apiPath,
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
    ]

    components.forEach(name =>
      addComponent({
        name,
        filePath: hasAiGatewayAuth
          ? resolve(`./runtime/components/${name}.vue`)
          : resolve('./runtime/components/AssistantChatDisabled.vue'),
      }),
    )

    if (!hasAiGatewayAuth) {
      log.warn('AI assistant disabled: neither AI_GATEWAY_API_KEY nor VERCEL_OIDC_TOKEN found')
      return
    }

    nuxt.options.runtimeConfig.assistant = {
      mcpServer: options.mcpServer,
      model: options.model,
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
