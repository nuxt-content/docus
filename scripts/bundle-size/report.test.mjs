import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterAll, test } from 'vitest'
import { buildSnapshot, compareSnapshots, initialAssetPaths, validateSnapshot } from './report.mjs'

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
  await writeFile(join(assetDir, 'chunk.js'), 'export const chunk = 1')
  await writeFile(join(assetDir, 'lazy.js'), 'export const lazy = 1')
  await writeFile(join(publicDir, 'en.html'), [
    '<link rel="stylesheet" href="/_nuxt/entry.css" crossorigin>',
    '<link rel="modulepreload" as="script" crossorigin href="/_nuxt/entry.js">',
    '<link rel="modulepreload" as="script" crossorigin href=\'/_nuxt/chunk.js?v=1\'>',
    '<link rel="prefetch" as="script" crossorigin href="/_nuxt/lazy.js">',
    '<link rel="modulepreload" href="https://cdn.example/_nuxt/missing.js">',
    '<script type="module" src="/_nuxt/entry.js" crossorigin></script>'
  ].join('\n'))
  await mkdir(join(publicDir, 'en/getting-started/installation'), { recursive: true })
  await writeFile(join(publicDir, 'en/getting-started/installation/index.html'), '<script type="module" src="/_nuxt/entry.js"></script>')
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
  head.routes['/en'].javascript.brotli += 10
  head.routes['/en'].files += 1

  assert.equal(base.schemaVersion, 3)
  assert.equal(base.assets, undefined)
  assert.equal(base.modules['node_modules/example/index.js'].brotli, 60)

  // Entry is deduplicated, prefetched and unknown assets are skipped.
  assert.deepEqual(Object.keys(base.routes), ['/en', '/en/getting-started/installation'])
  assert.equal(base.routes['/en'].files, 3)
  assert.equal(base.routes['/en'].javascript.raw, 'console.log("entry")'.length + 'export const chunk = 1'.length)
  assert.equal(base.routes['/en'].css.raw, 'body { color: green }'.length)
  assert.equal(base.routes['/en/getting-started/installation'].files, 1)

  const report = compareSnapshots(base, head)
  assert.match(report, /Client JavaScript/)
  assert.match(report, /Largest module increases/)
  assert.match(report, /report-only/)
  assert.match(report, /\| <code>\/en<\/code> \| .+ \| \+10 B \(.+\) \| — \| \+1 \|/)
  assert.ok(report.indexOf('### Initial page load') < report.indexOf('### All client assets'))
})

test('extracts upfront assets from prerendered HTML', () => {
  const paths = initialAssetPaths([
    '<LINK REL="stylesheet" HREF="/base/_nuxt/a.css">',
    '<link href=/_nuxt/b.js rel=modulepreload>',
    '<link rel="preload" as="fetch" href="/_payload.json">',
    '<script src="/_nuxt/legacy.js"></script>',
    '<script type="module" src="/_nuxt/c.js#hash"></script>'
  ].join(''))
  assert.deepEqual([...paths], ['_nuxt/a.css', '_nuxt/b.js', '_nuxt/c.js'])
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
    schemaVersion: 3,
    label: 'base',
    sha: 'a'.repeat(40),
    totals,
    routes: {},
    modules: {}
  }
  const head = {
    schemaVersion: 3,
    label: 'pr',
    sha: 'b'.repeat(40),
    totals,
    routes: {
      '/en': { javascript: { ...size }, css: { ...size }, files: 1 }
    },
    modules: {
      '`</code>|@nuxt<img src=x>`': size,
      '[click me](https://evil.example/)': size
    }
  }

  const report = compareSnapshots(base, head, { baseSha: base.sha, headSha: head.sha })
  assert.doesNotMatch(report, /@nuxt|<img|\[click me\]/)
  assert.match(report, /&#96;&lt;\/code&gt;&#124;&#64;nuxt&lt;img src=x&gt;&#96;/)
  assert.match(report, /&#91;click me&#93;\(https:\/\/evil\.example\/\)/)
  assert.match(report, /\| <code>\/en<\/code> \| n\/a \| 1 B \| n\/a \| n\/a \| n\/a \|/)

  assert.throws(
    () => validateSnapshot({ ...head, routes: { '/<img src=x>': head.routes['/en'] } }, { label: 'pr' }),
    /unexpected route/
  )
  assert.throws(
    () => validateSnapshot({ ...head, routes: { '/en': { ...head.routes['/en'], files: 1.5 } } }, { label: 'pr' }),
    /files must be an integer/
  )
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
    schemaVersion: 3,
    label: 'base',
    sha: 'a'.repeat(40),
    totals: emptyTotals,
    routes: {},
    modules: {}
  }
  const head = {
    schemaVersion: 3,
    label: 'pr',
    sha: 'b'.repeat(40),
    totals: emptyTotals,
    routes: {},
    modules: {
      constructor: { raw: 3, gzip: 2, brotli: 1 }
    }
  }

  const report = compareSnapshots(base, head)
  assert.match(report, /<code>constructor<\/code> \| 0 B \| 1 B \| \+1 B/)
  assert.doesNotMatch(report, /Initial page load/)
})
