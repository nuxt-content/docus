import { describe, expect, it } from 'vitest'
import { getAvailableLocales, isNavigationPath } from '../../layer/server/utils/content'

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
