import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { docsFolderExists, findLocaleFolder, landingPageExists } from '../../layer/utils/pages'

let rootDir: string

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), 'docus-pages-'))
})

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true })
})

describe('landingPageExists', () => {
  it('detects a user `app/pages/index.vue`', () => {
    expect(landingPageExists(rootDir)).toBe(false)
    mkdirSync(join(rootDir, 'app/pages'), { recursive: true })
    writeFileSync(join(rootDir, 'app/pages/index.vue'), '<template />')
    expect(landingPageExists(rootDir)).toBe(true)
  })
})

describe('docsFolderExists', () => {
  it('checks `content/docs` without a locale', () => {
    expect(docsFolderExists(rootDir)).toBe(false)
    mkdirSync(join(rootDir, 'content/docs'), { recursive: true })
    expect(docsFolderExists(rootDir)).toBe(true)
  })

  it('checks `content/<locale>/docs` with a locale', () => {
    mkdirSync(join(rootDir, 'content/fr/docs'), { recursive: true })
    expect(docsFolderExists(rootDir, 'fr')).toBe(true)
    expect(docsFolderExists(rootDir, 'en')).toBe(false)
  })
})

describe('findLocaleFolder', () => {
  it('returns undefined without a content folder', () => {
    expect(findLocaleFolder(rootDir, 'en')).toBeUndefined()
  })

  it('matches regardless of case and keeps the name on disk', () => {
    mkdirSync(join(rootDir, 'content/zh-TW'), { recursive: true })
    mkdirSync(join(rootDir, 'content/en'), { recursive: true })
    expect(findLocaleFolder(rootDir, 'zh-tw')).toBe('zh-TW')
    expect(findLocaleFolder(rootDir, 'EN')).toBe('en')
    expect(findLocaleFolder(rootDir, 'fr')).toBeUndefined()
  })
})
