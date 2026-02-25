import { join } from 'node:path'
import { extendViteConfig, createResolver, useNuxt } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  modules: [
    resolve('./modules/config'),
    resolve('./modules/routing'),
    resolve('./modules/markdown-rewrite'),
    resolve('./modules/css'),
    () => {
      const nuxt = useNuxt()
      nuxt.options.icon ||= {}
      nuxt.options.icon.customCollections ||= []
      nuxt.options.icon.customCollections.push({
        prefix: 'custom',
        dir: join(nuxt.options.srcDir, 'assets/icons'),
      })
    },
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxtjs/robots',
    '@nuxtjs/mcp-toolkit',
    'nuxt-og-image',
    'nuxt-llms',
    () => {
      // Update @nuxt/content optimizeDeps options
      extendViteConfig((config) => {
        config.optimizeDeps ||= {}
        config.optimizeDeps.include ||= []
        config.optimizeDeps.include.push('@nuxt/content > slugify')
        config.optimizeDeps.include = config.optimizeDeps.include
          .map(id => id.replace(/^@nuxt\/content > /, 'docus > @nuxt/content > '))

        // Fix @vercel/oidc ESM export issue (transitive dep of @ai-sdk/gateway)
        // Only needed when AI assistant is enabled.
        if (process.env.AI_GATEWAY_API_KEY) {
          config.optimizeDeps.include.push('@vercel/oidc')
          config.optimizeDeps.include.map(id => id.replace(/^@vercel\/oidc$/, 'docus > @vercel/oidc'))
        }
      })
    },
  ],
  devtools: {
    enabled: true,
  },
  content: {
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        highlight: {
          langs: ['bash', 'diff', 'json', 'js', 'ts', 'html', 'css', 'vue', 'shell', 'mdc', 'md', 'yaml'],
        },
        remarkPlugins: {
          'remark-mdc': {
            options: {
              autoUnwrap: true,
            },
          },
        },
      },
    },
  },
  mdc: {
    highlight: {
      shikiEngine: 'javascript',
    },
  },
  experimental: {
    asyncContext: true,
  },
  compatibilityDate: '2025-07-22',
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      autoSubfolderIndex: false,
    },
    compatibilityDate: {
      // Don't generate observability routes for now
      vercel: '2025-07-14',
    },
  },
  hooks: {
    'nitro:config'(nitroConfig) {
      const nuxt = useNuxt()

      const i18nOptions = nuxt.options.i18n

      const routes: string[] = []
      if (!i18nOptions) {
        routes.push('/')
      }
      else {
        routes.push(...(i18nOptions.locales?.map(locale => typeof locale === 'string' ? `/${locale}` : `/${locale.code}`) || []))
      }

      nitroConfig.prerender = nitroConfig.prerender || {}
      nitroConfig.prerender.routes = nitroConfig.prerender.routes || []
      nitroConfig.prerender.routes.push(...(routes || []))
      nitroConfig.prerender.routes.push('/sitemap.xml')
    },
  },
  icon: {
    customCollections: [
      {
        prefix: 'custom',
        dir: resolve('./app/assets/icons'),
      },
    ],
    clientBundle: {
      scan: true,
      includeCustomCollections: true,
    },
    provider: 'iconify',
  },
  robots: {
    groups: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: '/sitemap.xml',
  },
})
