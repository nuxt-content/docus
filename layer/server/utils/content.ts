import type { LocaleObject } from '@nuxtjs/i18n'
import { safeLocaleCode } from '../../utils/locale'

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

export function getCollectionsToQuery(locale: string | undefined, availableLocales: string[]): Array<{ collection: string, locale?: string }> {
  if (locale && availableLocales.includes(locale)) {
    return [{ collection: `docs_${safeLocaleCode(locale)}`, locale }]
  }

  return availableLocales.length > 0
    ? availableLocales.map(l => ({ collection: `docs_${safeLocaleCode(l)}`, locale: l }))
    : [{ collection: 'docs' }]
}

export function getCollectionFromPath(path: string, availableLocales: string[]): { collection: string, locale?: string } {
  const pathSegments = path.split('/').filter(Boolean)
  const firstSegment = pathSegments[0]

  if (firstSegment && availableLocales.includes(firstSegment)) {
    return { collection: `docs_${safeLocaleCode(firstSegment)}`, locale: firstSegment }
  }

  return { collection: 'docs' }
}
