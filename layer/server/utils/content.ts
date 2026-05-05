import type { LocaleObject } from '@nuxtjs/i18n'

interface VersionItem {
  label: string
  value: string
}

interface VersionsConfig {
  strategy: 'prefix' | 'state'
  default: string
  items: VersionItem[]
}

type ConfigWithLocalesAndVersions = {
  i18n?: { locales?: Array<string | LocaleObject> }
  docus?: {
    filteredLocales?: LocaleObject<string>[]
    versions?: VersionsConfig
  }
}

export function getAvailableLocales(config: ConfigWithLocalesAndVersions): string[] {
  if (config.docus?.filteredLocales) {
    return config.docus.filteredLocales.map(locale => locale.code)
  }

  return config.i18n?.locales
    ? config.i18n.locales.map(locale => typeof locale === 'string' ? locale : locale.code)
    : []
}

export function getAvailableVersions(config: ConfigWithLocalesAndVersions): VersionItem[] {
  return config.docus?.versions?.items || []
}

export function getDefaultVersion(config: ConfigWithLocalesAndVersions): string | undefined {
  const versions = config.docus?.versions
  if (!versions?.items?.length) return undefined
  return versions.default || versions.items[0]!.value
}

export function getVersionStrategy(config: ConfigWithLocalesAndVersions): 'prefix' | 'state' | undefined {
  return config.docus?.versions?.strategy
}

export function getVersionFromPath(path: string, availableVersions: VersionItem[], availableLocales: string[]): string | undefined {
  const segments = path.split('/').filter(Boolean)
  const startIdx = availableLocales.length > 0 && segments[0] && availableLocales.includes(segments[0]) ? 1 : 0
  const candidate = segments[startIdx]
  return candidate && availableVersions.some(v => v.value === candidate) ? candidate : undefined
}

export function getCollectionsToQuery(locale: string | undefined, availableLocales: string[], version?: string, availableVersions?: VersionItem[]): string[] {
  const isVersioned = !!availableVersions?.length

  if (isVersioned && version) {
    if (locale && availableLocales.includes(locale)) {
      return [`docs_${version}_${locale}`]
    }
    if (availableLocales.length > 0) {
      return availableLocales.map(l => `docs_${version}_${l}`)
    }
    return [`docs_${version}`]
  }

  if (isVersioned) {
    const allCollections: string[] = []
    for (const v of availableVersions!) {
      if (availableLocales.length > 0) {
        for (const l of availableLocales) {
          allCollections.push(`docs_${v.value}_${l}`)
        }
      }
      else {
        allCollections.push(`docs_${v.value}`)
      }
    }
    return allCollections
  }

  if (locale && availableLocales.includes(locale)) {
    return [`docs_${locale}`]
  }

  return availableLocales.length > 0
    ? availableLocales.map(l => `docs_${l}`)
    : ['docs']
}

export function getCollectionFromPath(path: string, availableLocales: string[], availableVersions?: VersionItem[]): string {
  const pathSegments = path.split('/').filter(Boolean)
  let name = 'docs'

  const firstSegment = pathSegments[0]
  const isFirstLocale = firstSegment && availableLocales.includes(firstSegment)
  const versionSegmentIdx = isFirstLocale ? 1 : 0
  const versionCandidate = pathSegments[versionSegmentIdx]

  if (availableVersions?.length && versionCandidate) {
    const matchedVersion = availableVersions.find(v => v.value === versionCandidate)
    if (matchedVersion) {
      name += `_${matchedVersion.value}`
      if (isFirstLocale) {
        name += `_${firstSegment}`
      }
      return name
    }
  }

  if (isFirstLocale) {
    return `docs_${firstSegment}`
  }

  return 'docs'
}
