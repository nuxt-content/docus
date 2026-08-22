import { addServerHandler, createResolver, defineNuxtModule } from '@nuxt/kit'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createCloudflareModuleWorkerRoutes, createMarkdownRoutes, createVercelNegotiationRoutes, type VercelRoute } from './runtime/server/utils/markdown-negotiation'

type I18nLocale = string | { code: string }
type DocusI18nOptions = { locales?: I18nLocale[] }
type DocusRuntimeConfig = {
  docus?: {
    markdownNegotiation?: {
      locales?: string[]
      routes?: Record<string, string>
    }
  }
}
type DocusCloudflareConfig = {
  cloudflare?: {
    wrangler?: {
      assets?: {
        run_worker_first?: boolean | string[]
      }
    }
  }
}

export default defineNuxtModule({
  meta: {
    name: 'markdown-rewrite',
  },
  setup(_options, nuxt) {
    const { resolve: resolveLayer } = createResolver(import.meta.url)
    const i18nOptions = (nuxt.options as typeof nuxt.options & { i18n?: DocusI18nOptions }).i18n
    const runtimeConfig = nuxt.options.runtimeConfig as DocusRuntimeConfig
    runtimeConfig.docus ||= {}
    runtimeConfig.docus.markdownNegotiation = {
      locales: (i18nOptions?.locales || []).map(locale => typeof locale === 'string' ? locale : locale.code),
      routes: {},
    }

    addServerHandler({
      handler: resolveLayer('./runtime/server/middleware/markdown-negotiation'),
      middleware: true,
    })

    nuxt.hooks.hook('nitro:init', (nitro) => {
      if (nitro.options.dev) {
        return
      }

      nitro.hooks.hook('prerender:done', async () => {
        const llmsText = await readFile(resolve(nitro.options.output.publicDir, 'llms.txt'), 'utf8')
          .catch(() => '')

        const nitroRuntimeConfig = nitro.options.runtimeConfig as DocusRuntimeConfig
        nitroRuntimeConfig.docus ||= {}
        const routes = createMarkdownRoutes(
          llmsText,
          runtimeConfig.docus?.markdownNegotiation?.locales,
        )
        nitroRuntimeConfig.docus.markdownNegotiation = {
          locales: runtimeConfig.docus?.markdownNegotiation?.locales,
          routes,
        }

        if (nitro.options.preset.includes('cloudflare-module')) {
          const options = nitro.options as DocusCloudflareConfig
          options.cloudflare ||= {}
          options.cloudflare.wrangler ||= {}
          options.cloudflare.wrangler.assets ||= {}
          options.cloudflare.wrangler.assets.run_worker_first = createCloudflareModuleWorkerRoutes(
            routes,
            options.cloudflare.wrangler.assets.run_worker_first,
          )
        }
      })

      if (nitro.options.preset.includes('vercel')) {
        nitro.hooks.hook('compiled', async () => {
          const configPath = resolve(nitro.options.output.dir, 'config.json')
          const vercelConfig = JSON.parse(await readFile(configPath, 'utf8')) as {
            routes?: VercelRoute[]
          }
          const config = nitro.options.runtimeConfig as DocusRuntimeConfig
          const routes = vercelConfig.routes || []
          const fallbackDestination = routes.find(route => route.src === '/(.*)' && route.dest)?.dest
          const negotiationRoutes = createVercelNegotiationRoutes(
            config.docus?.markdownNegotiation?.routes,
            fallbackDestination,
          )
          const filesystemIndex = routes.findIndex(route => route.handle === 'filesystem')
          routes.splice(filesystemIndex < 0 ? 0 : filesystemIndex, 0, ...negotiationRoutes)
          vercelConfig.routes = routes

          await writeFile(configPath, JSON.stringify(vercelConfig, null, 2), 'utf8')
        })
      }
    })
  },
})
