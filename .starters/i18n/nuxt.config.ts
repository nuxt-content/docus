export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@nuxtjs/i18n'],
  i18n: {
    defaultLocale: 'ar',
    locales: [{
      code: 'en',
      name: 'English',
    }, {
      code: 'ar',
      name: 'العربية',
      dir: 'rtl',
    }],
  },
})
