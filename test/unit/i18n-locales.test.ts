import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const localesDir = fileURLToPath(new URL('../../layer/i18n/locales/', import.meta.url))
const files = readdirSync(localesDir).filter(file => file.endsWith('.json'))

function flattenKeys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    child && typeof child === 'object' && !Array.isArray(child)
      ? flattenKeys(child as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )
}

function readLocale(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(`${localesDir}${file}`, 'utf8'))
}

const reference = flattenKeys(readLocale('en.json')).sort()

describe('layer i18n locales', () => {
  it.each(files)('%s has a valid BCP 47 file name', (file) => {
    const code = file.replace(/\.json$/, '')
    expect(() => Intl.getCanonicalLocales(code)).not.toThrow()
  })

  it.each(files)('%s has the same keys as en.json', (file) => {
    expect(flattenKeys(readLocale(file)).sort()).toEqual(reference)
  })

  it.each(files)('%s has no empty strings', (file) => {
    const locale = readLocale(file)
    const empty = flattenKeys(locale).filter(key =>
      key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], locale) === '',
    )
    expect(empty).toEqual([])
  })
})
