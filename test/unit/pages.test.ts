import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { docsFolderExists, findLocaleFolder, getContentSources, landingPageExists } from '../../layer/utils/pages'

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

describe('getContentSources', () => {
  const create = (...files: string[]) => {
    for (const file of files) {
      mkdirSync(join(rootDir, file, '..'), { recursive: true })
      writeFileSync(join(rootDir, file), '')
    }
  }

  it('serves the whole content folder as one `docs` source', () => {
    create('content/index.md', 'content/1.guide/1.intro.md', 'content/blog/post.md')
    expect(getContentSources(rootDir)).toEqual([{ name: 'docs', dir: '', prefix: '', exclude: [] }])
  })

  it('leaves `/` to the app when it has its own `app/pages/index.vue`', () => {
    create('content/index.md', 'content/1.guide/1.intro.md', 'app/pages/index.vue')
    expect(getContentSources(rootDir)[0]!.exclude).toEqual(['index.md'])
  })

  it('only keeps `docs/` and the landing page when `content/docs/` exists', () => {
    create('content/index.md', 'content/docs/intro.md', 'content/blog/post.md', 'content/about.md', 'content/.navigation.yml')
    expect(getContentSources(rootDir)[0]!.exclude.sort()).toEqual(['.navigation.yml', 'about.md', 'blog/**'])
  })

  it('declares one source per locale with a folder, named and prefixed by its code', () => {
    create('content/en/index.md', 'content/zh-TW/index.md', 'content/de/index.md', 'content/index.md')
    expect(getContentSources(rootDir, ['en', 'zh-tw', 'fr'])).toEqual([
      { name: 'docs_en', dir: 'en', prefix: '/en', exclude: [] },
      { name: 'docs_zh_tw', dir: 'zh-TW', prefix: '/zh-tw', exclude: [] },
    ])
  })

  it('applies the landing and `docs/` rules inside each locale folder', () => {
    create(
      'app/pages/index.vue',
      'content/en/index.md', 'content/en/docs/intro.md', 'content/en/blog/post.md',
      'content/fr/index.md', 'content/fr/guide.md',
    )
    expect(getContentSources(rootDir, ['en', 'fr']).map(source => source.exclude.sort())).toEqual([['blog/**', 'index.md'], ['index.md']])
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
