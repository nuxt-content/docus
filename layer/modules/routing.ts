import { defineNuxtModule, extendPages, createResolver } from '@nuxt/kit'
import { joinURL } from 'ufo'

export default defineNuxtModule({
  meta: {
    name: 'routing',
  },
  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    const isI18nEnabled = !!(nuxt.options.i18n && nuxt.options.i18n.locales)
    const docusConfig = nuxt.options.docus as { basePath?: string, isEmbedded?: boolean, landing?: boolean } | undefined
    const basePath = docusConfig?.basePath || '/'
    const isEmbedded = docusConfig?.isEmbedded || false
    const landing = docusConfig?.landing ?? !isEmbedded

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

    // In embedded mode, prefix Docus pages with basePath
    if (isEmbedded) {
      nuxt.hook('pages:extend', (pages) => {
        const docusPageIdx = pages.findIndex(p => p.file?.includes('layer/app/pages'))
        if (docusPageIdx !== -1) {
          const page = pages[docusPageIdx]!
          pages.splice(docusPageIdx, 1)
          pages.push({
            ...page,
            path: joinURL(basePath, page.path),
            name: `docus-${page.name || 'slug'}`,
            meta: { ...page.meta, layout: 'docus' },
          })
        }
      })
    }
  },
})
