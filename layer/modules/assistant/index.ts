import { addComponent, addImports, addServerHandler, addServerImports, createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { defu } from 'defu'

export interface AssistantModuleOptions {
  /**
   * Enable the assistant.
   *
   * When left undefined, the assistant is enabled if `AI_GATEWAY_API_KEY` or
   * `VERCEL_OIDC_TOKEN` is available at build time.
   *
   * Set it to `true` to use a custom AI SDK provider: Docus then skips
   * registering its own endpoint, and you provide a route at `apiPath` built
   * with `assistantSearchHandler`.
   *
   * Set it to `false` to disable the assistant even when AI Gateway
   * credentials are available.
   *
   * @default undefined
   */
  enabled?: boolean
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

/** Subset of the Nitro instance used to hand the endpoint over to a user route. */
interface NitroBuildContext {
  scannedHandlers: Array<{ route?: string }>
  options: { handlers: Array<{ route?: string, handler?: string }> }
}

const log = logger.withTag('docus')

const defaults: Required<Omit<AssistantModuleOptions, 'enabled'>> = {
  apiPath: '/__docus__/assistant',
  mcpServer: '/mcp',
  model: 'google/gemini-3-flash',
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

    const options = defu(nuxt.options.docus?.assistant, legacyOptions, defaults) as Required<AssistantModuleOptions>

    const hasAiGatewayAuth = !!(
      process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
    )

    // An explicit `enabled` value always wins, so a custom AI SDK provider can
    // be used without AI Gateway credentials.
    const isEnabled = options.enabled ?? hasAiGatewayAuth
    // Docus only owns the endpoint when it can authenticate to the AI Gateway.
    // Otherwise the user brings their own route built with `assistantSearchHandler`.
    const hasDefaultHandler = isEnabled && hasAiGatewayAuth

    const { resolve } = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.assistant = {
      enabled: isEnabled,
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
        filePath: isEnabled
          ? resolve(`./runtime/components/${name}.vue`)
          : resolve('./runtime/components/AssistantChatDisabled.vue'),
      }),
    )

    addComponent({
      name: 'AssistantComark',
      filePath: resolve('./runtime/components/AssistantComark'),
    })

    nuxt.options.runtimeConfig.assistant = {
      mcpServer: options.mcpServer,
      model: options.model,
    }

    // Exposed even when disabled so overriding the endpoint stays type-safe.
    addServerImports([
      {
        name: 'assistantSearchHandler',
        from: resolve('./runtime/server/utils/assistant'),
      },
      {
        name: 'getAssistantSystemPrompt',
        from: resolve('./runtime/server/utils/assistant'),
      },
    ])

    if (!isEnabled) {
      if (options.enabled === undefined) {
        nuxt.hook('modules:done', () => {
          log.warn('AI assistant disabled: neither `AI_GATEWAY_API_KEY` nor `VERCEL_OIDC_TOKEN` found')
        })
      }
      return
    }

    if (!hasDefaultHandler) {
      nuxt.hook('modules:done', () => {
        log.info(`AI assistant enabled without AI Gateway credentials: provide a server route at \`${options.apiPath}\` using \`assistantSearchHandler\``)
      })
      return
    }

    const routePath = options.apiPath!.replace(/^\//, '')
    const route = `/${routePath}`
    const handler = resolve('./runtime/server/api/search')

    addServerHandler({ route, handler })

    // A server route defined by the user at the same path would otherwise be
    // silently shadowed by the handler above, so drop ours when it exists.
    // `nitro:build:before` is declared by `@nuxt/nitro-server`, which Docus does
    // not depend on directly, hence the local typing.
    const hookNitroBuild = nuxt.hook as unknown as (
      name: 'nitro:build:before',
      callback: (nitro: NitroBuildContext) => void,
    ) => void

    hookNitroBuild('nitro:build:before', (nitro) => {
      if (!nitro.scannedHandlers.some(scanned => scanned.route === route)) {
        return
      }

      const index = nitro.options.handlers.findIndex(h => h.route === route && h.handler === handler)
      if (index === -1) {
        return
      }

      nitro.options.handlers.splice(index, 1)
      log.info(`AI assistant using your \`${route}\` server route instead of the built-in endpoint`)
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
