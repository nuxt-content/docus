import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterAll, test } from 'vitest'
import { buildSnapshot, compareSnapshots, validateSnapshot } from './report.mjs'

const temporaryDirectories = []

afterAll(async () => {
  await Promise.all(temporaryDirectories.map(directory => rm(directory, { force: true, recursive: true })))
})

test('builds and compares production bundle snapshots', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuxt-bundle-size-'))
  temporaryDirectories.push(root)

  const publicDir = join(root, '.output/public')
  const assetDir = join(publicDir, '_nuxt')
  const analyzePath = join(root, '.nuxt/analyze/client.json')
  await mkdir(assetDir, { recursive: true })
  await mkdir(join(root, '.nuxt/analyze'), { recursive: true })
  await writeFile(join(assetDir, 'entry.js'), 'console.log("entry")')
  await writeFile(join(assetDir, 'entry.css'), 'body { color: green }')
  await writeFile(join(assetDir, 'entry.js.map'), '{}')
  await writeFile(analyzePath, JSON.stringify({
    nodeParts: {
      part: {
        renderedLength: 100,
        gzipLength: 80,
        brotliLength: 60
      }
    },
    nodeMetas: {
      module: {
        id: join(root, 'node_modules/example/index.js'),
        moduleParts: { 'entry.js': 'part' }
      }
    }
  }))

  const base = await buildSnapshot({ root, analyzePath, label: 'base', sha: 'a'.repeat(40) })
  const head = structuredClone(base)
  head.label = 'pr'
  head.sha = 'b'.repeat(40)
  head.totals.javascript.brotli += 10
  head.totals.javascript.gzip += 12
  head.totals.all.brotli += 10
  head.totals.all.gzip += 12
  head.modules['node_modules/example/index.js'].brotli += 10

  assert.equal(base.schemaVersion, 2)
  assert.equal(base.assets, undefined)
  assert.equal(base.modules['node_modules/example/index.js'].brotli, 60)

  const report = compareSnapshots(base, head)
  assert.match(report, /Client JavaScript/)
  assert.match(report, /Largest module increases/)
  assert.match(report, /report-only/)
})

test('validates snapshots and safely renders module identifiers', () => {
  const size = { raw: 1, gzip: 1, brotli: 1 }
  const totals = {
    javascript: { ...size },
    css: { raw: 0, gzip: 0, brotli: 0 },
    other: { raw: 0, gzip: 0, brotli: 0 },
    all: { ...size }
  }
  const base = {
    schemaVersion: 2,
    label: 'base',
    sha: 'a'.repeat(40),
    totals,
    modules: {}
  }
  const head = {
    schemaVersion: 2,
    label: 'pr',
    sha: 'b'.repeat(40),
    totals,
    modules: {
      '`</code>|@nuxt<img src=x>`': size,
      '[click me](https://evil.example/)': size
    }
  }

  const report = compareSnapshots(base, head, { baseSha: base.sha, headSha: head.sha })
  assert.doesNotMatch(report, /@nuxt|<img|\[click me\]/)
  assert.match(report, /&#96;&lt;\/code&gt;&#124;&#64;nuxt&lt;img src=x&gt;&#96;/)
  assert.match(report, /&#91;click me&#93;\(https:\/\/evil\.example\/\)/)

  assert.throws(
    () => validateSnapshot({ ...base, schemaVersion: 1 }, { label: 'base' }),
    /Unsupported snapshot schema version/
  )
  assert.throws(
    () => compareSnapshots(base, head, { baseSha: base.sha, headSha: 'c'.repeat(40) }),
    /snapshot SHA does not match/
  )
})

test('reports PR-only module identifiers inherited by ordinary objects', () => {
  const emptyTotals = {
    javascript: { raw: 0, gzip: 0, brotli: 0 },
    css: { raw: 0, gzip: 0, brotli: 0 },
    other: { raw: 0, gzip: 0, brotli: 0 },
    all: { raw: 0, gzip: 0, brotli: 0 }
  }
  const base = {
    schemaVersion: 2,
    label: 'base',
    sha: 'a'.repeat(40),
    totals: emptyTotals,
    modules: {}
  }
  const head = {
    schemaVersion: 2,
    label: 'pr',
    sha: 'b'.repeat(40),
    totals: emptyTotals,
    modules: {
      constructor: { raw: 3, gzip: 2, brotli: 1 }
    }
  }

  const report = compareSnapshots(base, head)
  assert.match(report, /<code>constructor<\/code> \| 0 B \| 1 B \| \+1 B/)
})
