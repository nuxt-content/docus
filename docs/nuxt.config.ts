export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@nuxtjs/i18n', 'nuxt-studio'],
  css: ['~/assets/css/main.css'],
  site: {
    name: 'مجموعة العزب',
  },
  mdc: {
    highlight: {
      shikiEngine: 'javascript',
    },
  },
  compatibilityDate: '2025-07-18',
  vite: {
    build: {
      sourcemap: false,
    },
  },
  i18n: {
    defaultLocale: 'ar',
    locales: [{
      code: 'ar',
      name: 'العربية',
      dir: 'rtl',
    }],
  },
  llms: {
    domain: 'https://alazab.com',
    title: 'قاعدة معرفة مجموعة العزب',
    description: 'قاعدة المعرفة الرسمية لمجموعة العزب للحلول المعمارية.',
    full: {
      title: 'قاعدة معرفة مجموعة العزب',
      description: 'قاعدة المعرفة الرسمية لمجموعة العزب للحلول المعمارية.',
    },
  },
  mcp: {
    name: 'قاعدة معرفة مجموعة العزب',
    browserRedirect: '/ar',
  },
  studio: {
    route: '/admin',
    repository: {
      provider: 'github',
      owner: 'mohamedazab224',
      repo: 'docus',
      rootDir: 'docs',
    },
  },
})
