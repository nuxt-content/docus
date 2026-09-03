import type { LocaleObject } from '@nuxtjs/i18n'

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

/**
 * A locale code as `content.config.ts` spells it in a collection name, where a
 * dash is not valid. `pt-BR` is the `docs_pt_BR` collection, and asking for
 * `docs_pt-BR` finds nothing.
 */
export function collectionSuffix(locale: string): string {
  return locale.replace('-', '_')
}

export function getCollectionsToQuery(locale: string | undefined, availableLocales: string[]): string[] {
  if (locale && availableLocales.includes(locale)) {
    return [`docs_${collectionSuffix(locale)}`]
  }

  return availableLocales.length > 0
    ? availableLocales.map(l => `docs_${collectionSuffix(l)}`)
    : ['docs']
}

export function isNavigationPath(path: string): boolean {
  return path.endsWith('.navigation') || path.includes('/.navigation/')
}
