import { defineNuxtModule, addServerHandler, useLogger, createResolver } from '@nuxt/kit'
import { defu } from 'defu'

const { resolve } = createResolver(import.meta.url)

export interface ModuleOptions {
  /**
   * Enable or disable the MCP server
   * @default true
   */
  enabled?: boolean
  /**
   * The route path for the MCP server endpoint
   * @default '/mcp'
   */
  route?: string
  /**
   * URL to redirect to when a browser accesses the MCP endpoint
   * @default '/'
   */
  redirectTo?: string
  /**
   * The name of the MCP server
   * @default Site name from site config or 'Docus Documentation'
   */
  name?: string
  /**
   * The version of the MCP server
   * @default '1.0.0'
   */
  version?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'docus-mcp',
    configKey: 'mcp',
  },
  defaults: {
    enabled: true,
    route: '/mcp',
    redirectTo: '/',
    name: '',
    version: '1.0.0',
  },
  async setup(options, nuxt) {
    const logger = useLogger('docus:mcp')

    nuxt.options.runtimeConfig.mcp = defu(
      nuxt.options.runtimeConfig.mcp,
      {
        enabled: options.enabled,
        route: options.route,
        redirectTo: options.redirectTo,
        name: options.name,
        version: options.version,
      },
    )

    if (!options.enabled) {
      logger.info('MCP server is disabled')
      return
    }

    logger.info(`MCP server enabled at route: ${options.route}`)

    addServerHandler({
      route: '/.docus-mcp/list-pages',
      handler: resolve('./runtime/server/api/list-pages.get.ts'),
    })

    addServerHandler({
      route: '/.docus-mcp/get-page',
      handler: resolve('./runtime/server/api/get-page.get.ts'),
    })

    addServerHandler({
      route: options.route,
      handler: resolve('./runtime/server/handler.ts'),
    })
  },
})
