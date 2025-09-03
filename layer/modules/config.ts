import { createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { inferSiteURL, getPackageJsonMetadata } from '../utils/meta'
import { getGitBranch, getGitEnv, getLocalGitInfo } from '../utils/git'
import type { LocaleObject } from '@nuxtjs/i18n'

export default defineNuxtModule({
  meta: {
    name: 'config',
  },
  async setup(_options, nuxt) {
    const dir = nuxt.options.rootDir
    const url = inferSiteURL()
    const meta = await getPackageJsonMetadata(dir)
    const gitInfo = await getLocalGitInfo(dir) || getGitEnv()
    const siteName = nuxt.options?.site?.name || meta.name || gitInfo?.name || ''

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

    nuxt.options.appConfig.toc = defu(nuxt.options.appConfig.toc, {
      title: 'On this page',
    })

    /*
    ** I18N
    */
    if (nuxt.options.i18n && nuxt.options.i18n.locales) {
      const { resolve } = createResolver(import.meta.url)

      // Filter locales to only include existing ones
      const filteredLocales = nuxt.options.i18n.locales.filter((locale) => {
        const localeCode = typeof locale === 'string' ? locale : locale.code

        // Check for JSON locale file
        const localeFilePath = resolve('../i18n/locales', `${localeCode}.json`)
        const hasLocaleFile = existsSync(localeFilePath)

        // Check for content folder
        const contentPath = join(nuxt.options.rootDir, 'content', localeCode)
        const hasContentFolder = existsSync(contentPath)

        if (!hasLocaleFile) {
          console.warn(`Locale file not found: ${localeCode}.json - skipping locale "${localeCode}"`)
        }

        if (!hasContentFolder) {
          console.warn(`Content folder not found: content/${localeCode}/ - skipping locale "${localeCode}"`)
        }

        return hasLocaleFile && hasContentFolder
      })

      console.log('filteredLocales', filteredLocales)

      // Override strategy to prefix and update locales
      nuxt.options.i18n = {
        ...nuxt.options.i18n,
        strategy: 'prefix',
        locales: filteredLocales as LocaleObject<string>[],
      }

      console.log('nuxt.options.i18n', nuxt.options.i18n)

      nuxt.hook('i18n:registerModule', (register) => {
        const langDir = resolve('../i18n/locales')

        const locales = nuxt.options.i18n?.locales?.map((locale) => {
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

        console.log('locales', locales)

        register({
          langDir,
          locales,
        })
      })
    }
  },
})
