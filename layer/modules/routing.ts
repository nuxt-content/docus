import { defineNuxtModule, extendPages, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'routing',
  },
  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    const isI18nEnabled = !!(nuxt.options.i18n && nuxt.options.i18n.locales)

    // Ensure useDocusI18n is available in the app
    nuxt.hook('imports:extend', (imports) => {
      if (imports.some(i => i.name === 'useDocusI18n')) return

      imports.push({
        name: 'useDocusI18n',
        from: resolve('../app/composables/useDocusI18n'),
      })
    })

    extendPages((pages) => {
      const landingTemplate = resolve('../app/templates/landing.vue')

      if (isI18nEnabled) {
        // Get locale codes for regex pattern
        const locales = nuxt.options.i18n?.locales || []
        const localeCodes = locales.map((locale: string | { code: string }) =>
          typeof locale === 'string' ? locale : locale.code,
        ).join('|')

        // Use regex to only match valid locale codes or root
        // This prevents /:lang? from matching /en/mcp
        pages.unshift({
          name: 'lang-index',
          path: `/:lang(${localeCodes})?`,
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
  },
})
