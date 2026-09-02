import { createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { defu } from 'defu'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { ModuleOptions as AgentDiscoveryOptions } from 'nuxt-agent-discovery'
import { inferSiteURL, getPackageJsonMetadata } from '../utils/meta'
import { getGitBranch, getGitEnv, getLocalGitInfo } from '../utils/git'

const log = logger.withTag('docus')

type I18nLocale = string | { code: string, name?: string }
type DocusI18nOptions = { locales?: I18nLocale[], strategy?: string }
type DocusMcpOptions = { route?: string, enabled?: boolean, name?: string, browserRedirect?: string }
type RegisterModuleOptions = {
  langDir: string
  locales: Array<{ code: string, name: string, file: string }>
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
        // The layer serves `sitemap.xml` itself, so the module cannot detect it.
        links: [
          { href: '/sitemap.xml', rel: 'sitemap', type: 'application/xml', title: 'Sitemap (XML): every page, with its last modification date' },
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

      // Filter locales to only include existing ones
      const filteredLocales = i18nOptions.locales.filter((locale: I18nLocale) => {
        const localeCode = typeof locale === 'string' ? locale : locale.code

        // Check for JSON locale file
        const localeFilePath = resolve('../i18n/locales', `${localeCode}.json`)
        const hasLocaleFile = existsSync(localeFilePath)

        // Check for content folder
        const contentPath = join(nuxt.options.rootDir, 'content', localeCode)
        const hasContentFolder = existsSync(contentPath)

        if (!hasLocaleFile) {
          log.warn(`Locale file not found: ${localeCode}.json - skipping locale "${localeCode}"`)
        }

        if (!hasContentFolder) {
          log.warn(`Content folder not found: content/${localeCode}/ - skipping locale "${localeCode}"`)
        }

        return hasLocaleFile && hasContentFolder
      })

      // Override strategy to prefix
      typedNuxtOptions.i18n = {
        ...i18nOptions,
        strategy: 'prefix',
      }

      // Expose filtered locales
      nuxt.options.runtimeConfig.public.docus = {
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
        const langDir = resolve('../i18n/locales')

        const locales = filteredLocales.map((locale: I18nLocale) => {
          return typeof locale === 'string'
            ? {
                code: locale,
                name: locale,
                file: `${locale}.json`,
              }
            : {
                code: locale.code,
                name: locale.name || locale.code,
                file: `${locale.code}.json`,
              }
        })

        register({
          langDir,
          locales,
        })
      })
    }
  },
})
