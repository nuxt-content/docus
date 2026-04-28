import { defineNuxtModule, extendPages, createResolver } from '@nuxt/kit'
import { landingPageExists } from '../utils/pages'
import type { DocusVersionsConfig } from './config'

type DocusI18nOptions = { locales?: Array<string | { code: string }> }

export default defineNuxtModule({
  meta: {
    name: 'routing',
  },
  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    const i18nOptions = (nuxt.options as typeof nuxt.options & { i18n?: DocusI18nOptions }).i18n
    const isI18nEnabled = !!i18nOptions?.locales

    const typedOptions = nuxt.options as typeof nuxt.options & { docus?: { versions?: DocusVersionsConfig } }
    const versionsConfig = typedOptions.docus?.versions

    nuxt.hook('imports:extend', (imports) => {
      const composables = [
        { name: 'useDocusI18n', from: resolve('../app/composables/useDocusI18n') },
        { name: 'useVersion', from: resolve('../app/composables/useVersion') },
        { name: 'useCollectionName', from: resolve('../app/composables/useCollectionName') },
      ]

      for (const composable of composables) {
        if (!imports.some(i => i.name === composable.name)) {
          imports.push(composable)
        }
      }
    })

    // Only add landing if index.vue is not already defined
    if (!landingPageExists(nuxt.options.rootDir)) {
      extendPages((pages) => {
        const landingTemplate = resolve('../app/templates/landing.vue')

        if (isI18nEnabled) {
          pages.push({
            name: 'lang-index',
            path: '/:lang?',
            file: landingTemplate,
          })
        }
        else {
          pages.push({
            name: 'index',
            path: '/',
            file: landingTemplate,
          })
        }
      })
    }

    // Add version prerender hints for prefix strategy
    if (versionsConfig?.strategy === 'prefix' && versionsConfig.items?.length) {
      nuxt.hook('nitro:config', (nitroConfig) => {
        nitroConfig.prerender = nitroConfig.prerender || {}
        nitroConfig.prerender.routes = nitroConfig.prerender.routes || []

        for (const version of versionsConfig.items) {
          if (isI18nEnabled && i18nOptions?.locales) {
            for (const locale of i18nOptions.locales) {
              const code = typeof locale === 'string' ? locale : locale.code
              nitroConfig.prerender.routes.push(`/${code}/${version.value}`)
            }
          }
          else {
            nitroConfig.prerender.routes.push(`/${version.value}`)
          }
        }
      })
    }
  },
})
