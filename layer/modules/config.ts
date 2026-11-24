import { addTemplate, addTypeTemplate, createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { defu } from 'defu'
import { resolveModulePath } from 'exsolve'
import { readdirSync } from 'node:fs'
import { dirname } from 'pathe'
import type { ModuleOptions as AgentDiscoveryOptions } from 'nuxt-agent-discovery'
import { findLocaleFile, getLocaleKey, normalizeLocale } from '../utils/locale'
import { findLocaleFolder, getContentExclude } from '../utils/pages'
import { getPackageJsonMetadata, resolveSiteURL } from '../utils/meta'
import { getGitBranch, getGitEnv, getLocalGitInfo } from '../utils/git'

const log = logger.withTag('docus')

type I18nLocale = string | { code: string, name?: string, language?: string }
type DocusI18nOptions = { locales?: I18nLocale[], defaultLocale?: string, strategy?: string }
type DocusMcpOptions = { route?: string, enabled?: boolean, name?: string, browserRedirect?: string }
type DocusLlmsSection = { title: string, description?: string, navigation?: string }
type ContentOptions = { mode?: string, compatibilityVersion?: number }
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
    const url = resolveSiteURL(nuxt.options.site)
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
      filteredLocales: [] as Exclude<I18nLocale, string>[],
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
      markdownFormat: 'markdown/html',
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
    const i18nLocaleKeys: string[] = []
    let contentLocales: string[] | undefined

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

      const renamedCodes = i18nOptions.locales
        .map(locale => typeof locale === 'string' ? locale : locale.code)
        .filter(code => code !== normalizeLocale(code))
      if (renamedCodes.length) {
        log.info(`Locale codes are lowercased in URLs: ${renamedCodes.map(code => `${code} → ${normalizeLocale(code)}`).join(', ')}. Use the lowercase code to reference a locale, e.g. in \`localePath()\` or \`bundle.onlyLocales\`.`)
      }

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

      i18nLocaleKeys.push(...filteredLocales.map(locale => getLocaleKey(locale.code)))
      contentLocales = filteredLocales.map(locale => locale.code)

      // One `llms.txt` section per locale, after the app's own sections
      const llms = nuxt.options.llms as { sections?: DocusLlmsSection[] }
      llms.sections = [
        ...(llms.sections || []),
        ...filteredLocales.map(locale => ({ title: locale.name || locale.code, description: 'Every page below is available as raw markdown.', navigation: `/${locale.code}` })),
      ]

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

    /*
    ** Content: `docus.mode` decides how Nuxt Content runs
    */
    const mode = docusOptions?.mode ?? 'prerender'
    if (mode !== 'prerender') {
      throw new Error(`[docus] \`docus.mode: '${mode}'\` is not supported. Supported modes: 'prerender'.`)
    }

    const contentOptions = ((nuxt.options as typeof nuxt.options & { content?: ContentOptions }).content ||= {})
    const prerenderContentOptions = { mode: 'server-only', compatibilityVersion: 4 } as const
    for (const [key, value] of Object.entries(prerenderContentOptions) as [keyof ContentOptions, string | number][]) {
      if (contentOptions[key] !== undefined && contentOptions[key] !== value) {
        log.warn(`\`content.${key}: ${JSON.stringify(contentOptions[key])}\` is replaced by \`${JSON.stringify(value)}\`, which \`docus.mode: 'prerender'\` needs.`)
      }
      (contentOptions as Record<string, unknown>)[key] = value
    }

    // Read by the layer's `server/content.ts`, at build here and on the server through `nitro.replace`
    process.env.DOCUS_CONTENT_EXCLUDE = JSON.stringify(getContentExclude(dir, contentLocales))
    nuxt.options.nitro.replace = defu(nuxt.options.nitro.replace, {
      'process.env.DOCUS_CONTENT_EXCLUDE': JSON.stringify(process.env.DOCUS_CONTENT_EXCLUDE),
    })

    /*
    ** Nuxt UI locales
    */
    const uiLocaleDir = dirname(resolveModulePath('@nuxt/ui/locale', { from: import.meta.url }))
    const availableUiLocales = readdirSync(uiLocaleDir)
      .filter(file => file.endsWith('.js') && file !== 'index.js')
      .map(file => file.slice(0, -3))
    const bundledUiLocales = [...new Set(['en', ...i18nLocaleKeys])].filter(key => availableUiLocales.includes(key))
    const lazyUiLocales = i18nLocaleKeys.length ? [] : availableUiLocales.filter(key => !bundledUiLocales.includes(key))

    addTemplate({
      filename: 'docus/ui-locales.mjs',
      getContents: () => [
        `import { ${bundledUiLocales.join(', ')} } from '@nuxt/ui/locale'`,
        `export const uiLocales = { ${bundledUiLocales.join(', ')} }`,
        'export const uiLocaleLoaders = {',
        ...lazyUiLocales.map(key => `  ${key}: () => import('@nuxt/ui/runtime/locale/${key}.js').then(m => m.default),`),
        '}',
      ].join('\n'),
    })

    addTypeTemplate({
      filename: 'types/docus-ui-locales.d.ts',
      getContents: () => `declare module '#build/docus/ui-locales.mjs' {
  type UiLocale = typeof import('@nuxt/ui/locale')['en']
  export const uiLocales: Record<string, UiLocale>
  export const uiLocaleLoaders: Record<string, () => Promise<UiLocale>>
}
`,
    })
  },
})
