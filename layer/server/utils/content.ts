import type { LocaleObject } from '@nuxtjs/i18n'
import { getLocaleKey } from '../../utils/locale'

type ConfigWithLocales = {
  i18n?: { locales?: Array<string | LocaleObject> }
  docus?: { filteredLocales?: LocaleObject<string>[] }
}

export function getAvailableLocales(config: ConfigWithLocales): string[] {
  if (config.docus?.filteredLocales) {
    return config.docus.filteredLocales.map(locale => locale.code)
  }

  return config.i18n?.locales
    ? config.i18n.locales.map(locale => typeof locale === 'string' ? locale : locale.code)
    : []
}

export function getCollectionsToQuery(locale: string | undefined, availableLocales: string[]): string[] {
  if (locale && availableLocales.includes(locale)) {
    return [`docs_${getLocaleKey(locale)}`]
  }

  return availableLocales.length > 0
    ? availableLocales.map(l => `docs_${getLocaleKey(l)}`)
    : ['docs']
}

export function isNavigationPath(path: string): boolean {
  return path.endsWith('.navigation') || path.includes('/.navigation/')
}
