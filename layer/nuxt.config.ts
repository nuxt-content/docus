import { join } from 'node:path'
import { extendViteConfig, createResolver, useNuxt } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

type DocusI18nOptions = { locales?: Array<string | { code: string }> }

export default defineNuxtConfig({
  modules: [
    resolve('./modules/config'),
    resolve('./modules/routing'),
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
    'nuxt-agent-discovery',
    '@nuxt/image',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
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
        if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
          config.optimizeDeps.include.push('@vercel/oidc')
          config.optimizeDeps.include = config.optimizeDeps.include.map(id =>
            id.replace(/^@vercel\/oidc$/, 'docus > @vercel/oidc'),
          )
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

      const i18nOptions = (nuxt.options as typeof nuxt.options & { i18n?: DocusI18nOptions }).i18n

      const routes: string[] = []
      nitroConfig.prerender = nitroConfig.prerender || {}
      if (!i18nOptions) {
        routes.push('/')
      }
      else {
        routes.push(...(i18nOptions.locales?.map((locale: string | { code: string }) => typeof locale === 'string' ? `/${locale}` : `/${locale.code}`) || []))
        // With one sitemap per locale, `/sitemap.xml` only redirects to the
        // index, and Nitro would write that redirect as an HTML file the CDN
        // then serves for the XML URL.
        nitroConfig.prerender.ignore = nitroConfig.prerender.ignore || []
        nitroConfig.prerender.ignore.push('/sitemap.xml')
      }

      nitroConfig.prerender.routes = nitroConfig.prerender.routes || []
      nitroConfig.prerender.routes.push(...(routes || []))
      nitroConfig.prerender.routes.push('/openapi.json')
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
  ogImage: {
    zeroRuntime: true,
  },
  robots: {
    groups: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
  sitemap: {
    // Content is the source of truth: the prerendered routes would list every
    // page anyway, `sitemap: false` in a page's frontmatter included.
    excludeAppSources: true,
    sources: ['/api/__sitemap__/urls'],
  },
})
