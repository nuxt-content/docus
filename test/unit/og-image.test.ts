import { describe, expect, it } from 'vitest'
import { formatOgDescription, formatOgTitle } from '../../layer/app/utils/ogImage'

describe('formatOgTitle', () => {
  it('caps the title at 60 chars', () => {
    expect(formatOgTitle('a'.repeat(80))).toHaveLength(60)
  })

  it('keeps dots', () => {
    expect(formatOgTitle('Loading...')).toBe('Loading...')
    expect(formatOgTitle('Wait.. what')).toBe('Wait.. what')
    expect(formatOgTitle('The end.')).toBe('The end.')
  })

  it('returns undefined without a title', () => {
    expect(formatOgTitle(undefined)).toBeUndefined()
  })
})

describe('formatOgDescription', () => {
  it('keeps the trailing dot', () => {
    const description = 'Ship fast, flexible, and SEO-optimized documentation with beautiful design out of the box.'
    expect(formatOgDescription('Write beautiful docs with Markdown', description)).toBe(description)
  })

  it('keeps commas', () => {
    expect(formatOgDescription('Title', 'One, two, three')).toBe('One, two, three')
  })

  it('keeps dot runs', () => {
    expect(formatOgDescription('Title', 'Install it... then write')).toBe('Install it... then write')
  })

  it('cuts at the last sentence within the budget, keeping its dot', () => {
    const description = `${'a'.repeat(80)}. ${'b'.repeat(80)}.`
    expect(formatOgDescription('Title', description)).toBe(`${'a'.repeat(80)}.`)
  })

  it('returns undefined without a description', () => {
    expect(formatOgDescription('Title', undefined)).toBeUndefined()
  })
})
