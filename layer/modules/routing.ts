import { defineNuxtModule, extendPages, createResolver } from '@nuxt/kit'
import { landingPageExists } from '../utils/pages'

type DocusI18nOptions = { locales?: Array<string | { code: string }> }

export default defineNuxtModule({
  meta: {
    name: 'routing',
  },
  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    const i18nOptions = (nuxt.options as typeof nuxt.options & { i18n?: DocusI18nOptions }).i18n
    const isI18nEnabled = !!i18nOptions?.locales

    // Ensure useDocusI18n is available in the app
    nuxt.hook('imports:extend', (imports) => {
      if (imports.some(i => i.name === 'useDocusI18n')) return

      imports.push({
        name: 'useDocusI18n',
        from: resolve('../app/composables/useDocusI18n'),
      })
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
  },
})
