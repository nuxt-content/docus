import { createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { defu } from 'defu'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { inferSiteURL, getPackageJsonMetadata } from '../utils/meta'
import { getGitBranch, getGitEnv, getLocalGitInfo } from '../utils/git'

const log = logger.withTag('Docus')

type I18nLocale = string | { code: string, name?: string }
type DocusI18nOptions = { locales?: I18nLocale[], strategy?: string }
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
    })

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
    ** I18N
    */
    const typedNuxtOptions = nuxt.options as typeof nuxt.options & { i18n?: DocusI18nOptions }
    const i18nOptions = typedNuxtOptions.i18n

    if (i18nOptions?.locales) {
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
