export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@nuxtjs/plausible', '@nuxtjs/i18n', 'nuxt-studio'],
  css: ['~/assets/css/main.css'],
  site: {
    name: 'Docus',
  },
  content: {
    preview: {
      api: 'https://api.nuxt.studio',
      dev: true,
    },
  },
  compatibilityDate: '2025-07-18',
  contentStudio: {
    repository: {
      owner: 'nuxt-content',
      repo: 'docus',
      branch: 'main',
      rootDir: 'docs',
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: [{
      code: 'en',
      name: 'English',
    }, {
      code: 'fr',
      name: 'Français',
    }],
  },
  llms: {
    domain: 'https://docus.dev',
    title: 'Docus',
    description: 'Write beautiful docs with Markdown.',
    full: {
      title: 'Docus',
      description: 'Write beautiful docs with Markdown.',
    },
  },
})
