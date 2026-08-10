import { addComponent, addImports, addServerHandler, createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { defu } from 'defu'

export type AssistantProvider = 'vercel' | 'cloudflare'

export interface CloudflareAssistantOptions {
  /**
   * Cloudflare account ID.
   * @default ''
   */
  accountId?: string
  /**
   * Cloudflare AI Gateway ID.
   * @default ''
   */
  gateway?: string
}

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
   * AI Gateway provider to use.
   * @default 'vercel'
   */
  provider?: AssistantProvider
  /**
   * Cloudflare AI Gateway configuration.
   * Only used when `provider` is `'cloudflare'`.
   */
  cloudflare?: CloudflareAssistantOptions
  /**
   * AI model to use via the configured AI Gateway
   * @default 'google/gemini-3-flash' for Vercel, 'workers-ai/@cf/zai-org/glm-4.7-flash' for Cloudflare
   */
  model?: string
}

const log = logger.withTag('docus')

const defaultModels = {
  vercel: 'google/gemini-3-flash',
  cloudflare: 'workers-ai/@cf/zai-org/glm-4.7-flash',
} as const

const defaults: Required<AssistantModuleOptions> = {
  apiPath: '/__docus__/assistant',
  mcpServer: '/mcp',
  provider: 'vercel',
  cloudflare: {
    accountId: '',
    gateway: '',
  },
  model: defaultModels.vercel,
}

export default defineNuxtModule<AssistantModuleOptions>({
  meta: {
    name: 'assistant',
  },
  setup(_options, nuxt) {
    const legacyOptions = nuxt.options.assistant
    if (legacyOptions && Object.keys(legacyOptions).length > 0) {
      log.warn('`assistant` top-level config is deprecated. Move it under `docus.assistant` in nuxt.config.ts')
    }

    const configuredOptions = defu(nuxt.options.docus?.assistant, legacyOptions) as AssistantModuleOptions
    const provider = configuredOptions.provider || defaults.provider
    const options = defu(configuredOptions, {
      ...defaults,
      provider,
      model: provider === 'cloudflare' ? defaultModels.cloudflare : defaultModels.vercel,
    }) as Required<AssistantModuleOptions>

    const cloudflareAccountId = options.cloudflare?.accountId || ''
    const cloudflareGateway = options.cloudflare?.gateway || ''
    const isAssistantConfigured = options.provider === 'cloudflare'
      ? true
      : !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)

    const { resolve } = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.assistant = {
      enabled: isAssistantConfigured,
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
        filePath: isAssistantConfigured
          ? resolve(`./runtime/components/${name}.vue`)
          : resolve('./runtime/components/AssistantChatDisabled.vue'),
      }),
    )

    addComponent({
      name: 'AssistantComark',
      filePath: resolve('./runtime/components/AssistantComark'),
    })

    if (!isAssistantConfigured) {
      nuxt.hook('modules:done', () => {
        if (options.provider === 'vercel') {
          log.warn('AI assistant disabled: neither `AI_GATEWAY_API_KEY` nor `VERCEL_OIDC_TOKEN` found')
        }
      })
      return
    }

    nuxt.options.runtimeConfig.assistant = {
      mcpServer: options.mcpServer,
      model: options.model,
      provider: options.provider,
      cloudflare: {
        accountId: cloudflareAccountId,
        aiGatewayId: cloudflareGateway,
        aigToken: '',
      },
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
      provider: AssistantProvider
      cloudflare: {
        accountId: string
        aiGatewayId: string
        aigToken: string
      }
    }
  }
}
