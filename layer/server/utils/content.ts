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

export function getCollectionFromPath(path: string, availableLocales: string[]): string {
  const pathSegments = path.split('/').filter(Boolean)
  const firstSegment = pathSegments[0]

  if (firstSegment && availableLocales.includes(firstSegment)) {
    return `docs_${getLocaleKey(firstSegment)}`
  }

  return 'docs'
}

/** Maps a `docs_*` collection name back to the locale code it was built from. */
export function getLocaleFromCollection(collectionName: string, availableLocales: string[]): string {
  const key = collectionName.replace('docs_', '')

  return availableLocales.find(locale => getLocaleKey(locale) === key) || key
}
