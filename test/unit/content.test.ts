import { describe, expect, it } from 'vitest'
import { getAvailableLocales, getCollectionsToQuery, isNavigationPath } from '../../layer/server/utils/content'

describe('getAvailableLocales', () => {
  it('prefers the filtered locales', () => {
    expect(getAvailableLocales({
      i18n: { locales: ['en', 'fr', 'de'] },
      docus: { filteredLocales: [{ code: 'en' }, { code: 'fr' }] },
    })).toEqual(['en', 'fr'])
  })

  it('accepts string and object locales', () => {
    expect(getAvailableLocales({ i18n: { locales: ['en', { code: 'pt-br' }] } })).toEqual(['en', 'pt-br'])
  })

  it('returns an empty list without i18n', () => {
    expect(getAvailableLocales({})).toEqual([])
  })
})

describe('getCollectionsToQuery', () => {
  it('queries the single docs collection without i18n', () => {
    expect(getCollectionsToQuery(undefined, [])).toEqual(['docs'])
    expect(getCollectionsToQuery('en', [])).toEqual(['docs'])
  })

  it('queries one collection for a known locale', () => {
    expect(getCollectionsToQuery('fr', ['en', 'fr'])).toEqual(['docs_fr'])
  })

  it('uses identifier-safe names for hyphenated locales', () => {
    expect(getCollectionsToQuery('pt-br', ['en', 'pt-br'])).toEqual(['docs_pt_br'])
  })

  it('queries every locale when none or an unknown one is given', () => {
    expect(getCollectionsToQuery(undefined, ['en', 'zh-tw'])).toEqual(['docs_en', 'docs_zh_tw'])
    expect(getCollectionsToQuery('de', ['en', 'fr'])).toEqual(['docs_en', 'docs_fr'])
  })
})

describe('isNavigationPath', () => {
  it('matches `.navigation` files and folders', () => {
    expect(isNavigationPath('/en/getting-started/.navigation')).toBe(true)
    expect(isNavigationPath('/en/.navigation/foo')).toBe(true)
  })

  it('ignores regular pages', () => {
    expect(isNavigationPath('/en/getting-started/navigation')).toBe(false)
    expect(isNavigationPath('/en/getting-started')).toBe(false)
  })
})
