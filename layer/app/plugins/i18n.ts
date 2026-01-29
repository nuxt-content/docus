import en from '../../i18n/locales/en.json'
import type { RouteLocationNormalized } from 'vue-router'

const locales = import.meta.glob('../../i18n/locales/*.json', { import: 'default' })

function loadLocale(name: string) {
  return locales[`../../i18n/locales/${name}.json`]?.()
}

export default defineNuxtPlugin(async () => {
  const nuxtApp = useNuxtApp()

  const i18nConfig = nuxtApp.$config.public.i18n

  // If i18n is not enabled, fetch and provide the configured locale in app config
  if (!i18nConfig) {
    const locale = useAppConfig().docus?.locale || 'en'
    const resolvedMessages = locale !== 'en'
      ? (await loadLocale(locale) || en)
      : en

    nuxtApp.provide('locale', locale)
    nuxtApp.provide('localeMessages', resolvedMessages)

    return
  }

  addRouteMiddleware((to: RouteLocationNormalized) => {
    if (to.path === '/') {
      const cookieLocale = useCookie('i18n_redirected').value || i18nConfig.defaultLocale || 'en'

      return navigateTo(`/${cookieLocale}`)
    }
  })
})
