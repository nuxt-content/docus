import { describe, expect, it } from 'vitest'
import { findLocaleFile, getLocaleKey, getLocaleRedirect, normalizeLocale } from '../../layer/utils/locale'

describe('normalizeLocale', () => {
  it('lowercases the whole tag', () => {
    expect(normalizeLocale('en')).toBe('en')
    expect(normalizeLocale('pt-BR')).toBe('pt-br')
    expect(normalizeLocale('zh-Hant-TW')).toBe('zh-hant-tw')
  })
})

describe('getLocaleKey', () => {
  it('returns a valid identifier for collection names', () => {
    expect(getLocaleKey('fr')).toBe('fr')
    expect(getLocaleKey('pt-BR')).toBe('pt_br')
    expect(getLocaleKey('zh-Hant-TW')).toBe('zh_hant_tw')
    expect(getLocaleKey('zh-TW')).toMatch(/^[a-z_]+$/)
  })
})

describe('findLocaleFile', () => {
  const files = ['en.json', 'pt-BR.json', 'zh-TW.json']

  it('matches regardless of case', () => {
    expect(findLocaleFile('en', files)).toBe('en.json')
    expect(findLocaleFile('pt-br', files)).toBe('pt-BR.json')
    expect(findLocaleFile('ZH-tw', files)).toBe('zh-TW.json')
  })

  it('returns undefined for unknown locales', () => {
    expect(findLocaleFile('xx', files)).toBeUndefined()
    expect(findLocaleFile('pt', files)).toBeUndefined()
  })
})

describe('getLocaleRedirect', () => {
  const codes = ['en', 'pt-br', 'zh-tw']

  it('lowercases a known locale prefix', () => {
    expect(getLocaleRedirect('/pt-BR', codes)).toBe('/pt-br')
    expect(getLocaleRedirect('/pt-BR/getting-started', codes)).toBe('/pt-br/getting-started')
    expect(getLocaleRedirect('/ZH-TW/a/b?c=1#d', codes)).toBe('/zh-tw/a/b?c=1#d')
  })

  it('leaves lowercase paths alone', () => {
    expect(getLocaleRedirect('/pt-br/getting-started', codes)).toBeUndefined()
    expect(getLocaleRedirect('/', codes)).toBeUndefined()
  })

  it('ignores prefixes that are not locales', () => {
    expect(getLocaleRedirect('/Getting-Started', codes)).toBeUndefined()
    expect(getLocaleRedirect('/EN-US/page', codes)).toBeUndefined()
  })

  it('only looks at the first segment', () => {
    expect(getLocaleRedirect('/en/PT-BR', codes)).toBeUndefined()
  })
})
