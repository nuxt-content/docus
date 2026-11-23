import { join } from 'node:path'
import { createResolver, useNuxt } from '@nuxt/kit'
import { getLocaleRedirect } from './utils/locale'

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
    'nuxt-schema-org',
    'nuxt-og-image',
    'nuxt-llms',
  ],
  devtools: {
    enabled: true,
  },
  content: {
    build: {
      markdown: {
        highlight: {
          langs: ['bash', 'diff', 'json', 'js', 'ts', 'html', 'css', 'vue', 'shell', 'mdc', 'md', 'yaml'],
        },
      },
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
        const localeCodes = i18nOptions.locales?.map((locale: string | { code: string }) => typeof locale === 'string' ? locale : locale.code) || []
        routes.push(...localeCodes.map(code => `/${code}`))
        nitroConfig.prerender.ignore = nitroConfig.prerender.ignore || []
        // Uppercase locale links redirect to their lowercase page.
        // Prerendering them would overwrite that page on case-insensitive disks.
        nitroConfig.prerender.ignore.push(path => !!getLocaleRedirect(path, localeCodes))
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
  // TODO: Fix MCP toolkit adding MCP blocks in llms.txt
  mcp: {
    llms: false,
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
