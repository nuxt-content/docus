import { defineNuxtModule, extendPages, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'routing',
  },
  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    const isI18nEnabled = !!(nuxt.options.i18n && nuxt.options.i18n.locales)
    const docusConfig = nuxt.options.docus as { basePath?: string, landing?: boolean } | undefined
    // const basePath = docusConfig?.basePath || '/'
    // const isEmbedded = basePath !== '/docs'
    const landing = docusConfig?.landing

    // Ensure useDocusI18n is available in the app
    nuxt.hook('imports:extend', (imports) => {
      if (imports.some(i => i.name === 'useDocusI18n')) return

      imports.push({
        name: 'useDocusI18n',
        from: resolve('../app/composables/useDocusI18n'),
      })
    })

    // Add landing page only if enabled
    if (landing) {
      extendPages((pages) => {
        const landingTemplate = resolve('../app/templates/landing.vue')

        if (isI18nEnabled) {
          pages.push({
            name: 'lang-index',
            path: '/:lang?',
            file: landingTemplate,
            meta: { layout: landing === true ? 'default' : landing },
          })
        }
        else {
          pages.push({
            name: 'index',
            path: '/',
            file: landingTemplate,
            meta: { layout: landing === true ? 'default' : landing },
          })
        }
      })
    }
  },
})
