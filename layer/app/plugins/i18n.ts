import type { RouteLocationNormalized } from 'vue-router'
import { consola } from 'consola'

const log = consola.withTag('Docus')

// Lazy import functions for locale files (bundled but not eagerly loaded)
const localeFiles = import.meta.glob<{ default: Record<string, unknown> }>('../../i18n/locales/*.json')

export default defineNuxtPlugin(async () => {
  const nuxtApp = useNuxtApp()

  const i18nConfig = nuxtApp.$config.public.i18n

  // If i18n is not enabled, fetch and provide the configured locale in app config
  if (!i18nConfig) {
    const appConfig = useAppConfig()
    const configuredLocale = appConfig.docus.locale || 'en'

    let locale = configuredLocale
    let resolvedMessages: Record<string, unknown>

    // Try to load the requested locale file
    const localeKey = `../../i18n/locales/${configuredLocale}.json`
    const localeLoader = localeFiles[localeKey]

    if (localeLoader) {
      const localeModule = await localeLoader()
      resolvedMessages = localeModule.default
    }
    else {
      log.warn(`Missing locale file for "${configuredLocale}". Falling back to "en".`)
      locale = 'en'
      const fallbackKey = '../../i18n/locales/en.json'
      const fallbackLoader = localeFiles[fallbackKey]
      if (fallbackLoader) {
        const fallbackModule = await fallbackLoader()
        resolvedMessages = fallbackModule.default
      }
      else {
        resolvedMessages = {} as Record<string, unknown>
      }
    }

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
