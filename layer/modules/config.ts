import { createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { defu } from 'defu'
import { readdirSync } from 'node:fs'
import type { ModuleOptions as AgentDiscoveryOptions } from 'nuxt-agent-discovery'
import { findLocaleFile, normalizeLocale } from '../utils/locale'
import { findLocaleFolder } from '../utils/pages'
import { inferSiteURL, getPackageJsonMetadata } from '../utils/meta'
import { getGitBranch, getGitEnv, getLocalGitInfo } from '../utils/git'

const log = logger.withTag('docus')

type I18nLocale = string | { code: string, name?: string, language?: string }
type DocusI18nOptions = { locales?: I18nLocale[], defaultLocale?: string, strategy?: string }
type DocusMcpOptions = { route?: string, enabled?: boolean, name?: string, browserRedirect?: string }
type RegisterModuleOptions = {
  langDir: string
  locales: Array<{ code: string, name: string, language: string, file: string }>
}

export default defineNuxtModule({
  meta: {
    name: 'config',
  },
  async setup(_options, nuxt) {
    const dir = nuxt.options.rootDir
    const url = inferSiteURL()
    const meta = await getPackageJsonMetadata(dir)
    const gitInfo = await getLocalGitInfo(dir) || getGitEnv()
    const siteName = (typeof nuxt.options.site === 'object' && nuxt.options.site?.name) || meta.name || gitInfo?.name || ''

    nuxt.options.llms = defu(nuxt.options.llms, {
      domain: url,
      title: siteName,
      description: meta.description || '',
      full: {
        title: siteName,
        description: meta.description || '',
      },
    })

    nuxt.options.site = defu(nuxt.options.site, {
      url,
      name: siteName,
      debug: false,
    }) as typeof nuxt.options.site

    nuxt.options.appConfig.header = defu(nuxt.options.appConfig.header, {
      title: siteName,
    })

    nuxt.options.appConfig.seo = defu(nuxt.options.appConfig.seo, {
      titleTemplate: `%s - ${siteName}`,
      title: siteName,
      description: meta.description || '',
    })

    // `version` feeds the OpenAPI document, `filteredLocales` is filled in by the i18n block below
    nuxt.options.runtimeConfig.public.docus = defu(nuxt.options.runtimeConfig.public.docus, {
      version: meta.version || '0.0.0',
      filteredLocales: [] as I18nLocale[],
    })

    nuxt.options.appConfig.github = defu(nuxt.options.appConfig.github, {
      owner: gitInfo?.owner,
      name: gitInfo?.name,
      url: gitInfo?.url,
      branch: getGitBranch(),
    })

    /*
    ** MCP route (expose to client so the page header dropdown stays in sync
    ** with the user-configured `mcp.route` from @nuxtjs/mcp-toolkit)
    */
    const rawMcpOptions = (nuxt.options as typeof nuxt.options & { mcp?: false | DocusMcpOptions }).mcp
    const mcpOptions = rawMcpOptions || undefined
    const mcpEnabled = rawMcpOptions !== false && mcpOptions?.enabled !== false
    const mcpRoute = mcpOptions?.route || '/mcp'
    nuxt.options.runtimeConfig.public.mcp = defu(
      nuxt.options.runtimeConfig.public.mcp as DocusMcpOptions | undefined,
      { route: mcpRoute },
    )

    /*
    ** Agent discovery (nuxt-agent-discovery): `siteUrl` and `siteName` resolve
    ** from `site` above, the rest only needs what the layer knows.
    */
    const docusOptions = nuxt.options.docus
    if (docusOptions?.skills) {
      log.warn('`docus.skills` is deprecated. Move it to `agentDiscovery.skills` in nuxt.config.ts')
    }
    if (docusOptions?.notFound !== undefined) {
      log.warn('`docus.notFound` is deprecated. Use `agentDiscovery.errors` in nuxt.config.ts')
    }

    const typedNuxtOptions = nuxt.options as typeof nuxt.options & {
      agentDiscovery?: AgentDiscoveryOptions
      i18n?: false | DocusI18nOptions
    }

    typedNuxtOptions.agentDiscovery = defu(typedNuxtOptions.agentDiscovery, {
      discovery: {
        mcpServerCard: !mcpEnabled
          ? false
          : {
              endpoint: mcpRoute,
              name: mcpOptions?.name || siteName,
              ...(mcpOptions?.browserRedirect && mcpOptions.browserRedirect !== '/' ? { documentation: mcpOptions.browserRedirect } : {}),
            },
        // `server/routes/openapi.json.get.ts`, the one document the module cannot know about.
        links: [
          { href: '/openapi.json', rel: 'service-desc', type: 'application/vnd.oai.openapi+json', title: 'OpenAPI document: every route this site serves to agents', anchor: '/' },
        ],
      },
      ...(docusOptions?.skills ? { skills: docusOptions.skills } : {}),
      ...(docusOptions?.notFound === false ? { errors: false } : {}),
    }) as AgentDiscoveryOptions

    const forcedColorMode = (nuxt.options.appConfig.docus as Record<string, unknown>)?.colorMode as string | undefined
    if (forcedColorMode === 'light' || forcedColorMode === 'dark') {
      nuxt.options.colorMode = defu({ preference: forcedColorMode, fallback: forcedColorMode }, nuxt.options.colorMode || {}) as typeof nuxt.options.colorMode
    }

    /*
    ** I18N
    */
    const i18nOptions = typedNuxtOptions.i18n

    if (i18nOptions && typeof i18nOptions === 'object' && i18nOptions.locales) {
      const { resolve } = createResolver(import.meta.url)
      const langDir = resolve('../i18n/locales')
      const localeFileNames = readdirSync(langDir)

      // Keep the original tag as `language` for `html lang` and `hreflang`
      const normalizeLocaleEntry = (locale: I18nLocale) => {
        const code = typeof locale === 'string' ? locale : locale.code
        const base = typeof locale === 'string' ? { name: code, language: code } : locale

        return { ...base, code: normalizeLocale(code), language: base.language || code }
      }

      const normalizedLocales = i18nOptions.locales.map(normalizeLocaleEntry)

      // Filter locales to only include existing ones
      const filteredLocales = normalizedLocales.filter((locale) => {
        const localeCode = locale.code

        // Check for JSON locale file
        const localeFile = findLocaleFile(localeCode, localeFileNames)

        // Check for content folder
        const contentFolder = findLocaleFolder(nuxt.options.rootDir, localeCode)

        if (!localeFile) {
          log.warn(`Locale file not found: ${localeCode}.json - skipping locale "${localeCode}"`)
        }

        if (!contentFolder) {
          log.warn(`Content folder not found: content/${localeCode}/ - skipping locale "${localeCode}"`)
        }

        return !!localeFile && !!contentFolder
      })

      // Override strategy to prefix
      typedNuxtOptions.i18n = {
        ...i18nOptions,
        locales: normalizedLocales,
        defaultLocale: i18nOptions.defaultLocale && normalizeLocale(i18nOptions.defaultLocale),
        strategy: 'prefix',
      }

      // @nuxtjs/i18n reads locales from each layer config, not from the merged options
      for (const layer of nuxt.options._layers) {
        const layerI18n = (layer.config as { i18n?: DocusI18nOptions }).i18n

        if (layerI18n?.locales) {
          layerI18n.locales = layerI18n.locales.map(normalizeLocaleEntry)

          if (layerI18n.defaultLocale) {
            layerI18n.defaultLocale = normalizeLocale(layerI18n.defaultLocale)
          }
        }
      }

      // Expose filtered locales
      nuxt.options.runtimeConfig.public.docus = {
        ...nuxt.options.runtimeConfig.public.docus,
        filteredLocales,
      }

      // `sitemap.md` groups pages by first path segment, so label each locale section with its name
      typedNuxtOptions.agentDiscovery = defu(typedNuxtOptions.agentDiscovery, {
        sitemap: {
          markdown: {
            labels: Object.fromEntries(filteredLocales.map((locale: I18nLocale) => typeof locale === 'string'
              ? [locale, locale]
              : [locale.code, locale.name || locale.code],
            )),
          },
        },
      }) as AgentDiscoveryOptions

      const registerI18nModule = nuxt.hook as unknown as (name: string, callback: (register: (options: RegisterModuleOptions) => void) => void) => void

      registerI18nModule('i18n:registerModule', (register) => {
        const locales = filteredLocales.flatMap((locale) => {
          const file = findLocaleFile(locale.code, localeFileNames)

          return file
            ? [{ code: locale.code, name: locale.name || locale.code, language: locale.language, file }]
            : []
        })

        register({
          langDir,
          locales,
        })
      })
    }
  },
})
