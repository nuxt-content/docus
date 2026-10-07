import { constants, brotliCompressSync, gzipSync } from 'node:zlib'
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const EMPTY_SIZE = Object.freeze({ raw: 0, gzip: 0, brotli: 0 })
const SNAPSHOT_SCHEMA_VERSION = 2
const MAX_SNAPSHOT_BYTES = 5 * 1024 * 1024
const MAX_MODULES = 25_000
const MAX_MODULE_ID_LENGTH = 2_048

function addSizes(target, sizes) {
  target.raw += sizes.raw
  target.gzip += sizes.gzip
  target.brotli += sizes.brotli
  return target
}

function compressedSizes(contents) {
  return {
    raw: contents.byteLength,
    gzip: gzipSync(contents, { level: 9 }).byteLength,
    brotli: brotliCompressSync(contents, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11
      }
    }).byteLength
  }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listFiles(path))
    } else if (entry.isFile()) {
      files.push(path)
    }
  }

  return files
}

function assetKind(file) {
  const extension = extname(file)
  if (extension === '.js' || extension === '.mjs') {
    return 'javascript'
  }
  if (extension === '.css') {
    return 'css'
  }
  return 'other'
}

function normalizePath(path) {
  return path.replaceAll('\\', '/')
}

function normalizeModuleId(id, root) {
  let normalized = normalizePath(id).replace(/^\0/, 'virtual:')
  const normalizedRoot = `${normalizePath(resolve(root))}/`

  if (normalized.startsWith(normalizedRoot)) {
    normalized = normalized.slice(normalizedRoot.length)
  }

  const nodeModulesIndex = normalized.lastIndexOf('/node_modules/')
  if (nodeModulesIndex !== -1) {
    normalized = `node_modules/${normalized.slice(nodeModulesIndex + '/node_modules/'.length)}`
  }

  const pnpmMatch = normalized.match(/^node_modules\/\.pnpm\/[^/]+\/node_modules\/(.+)$/)
  return pnpmMatch ? `node_modules/${pnpmMatch[1]}` : normalized
}

async function readAnalyzerModules(analyzePath, root) {
  const analyzer = JSON.parse(await readFile(analyzePath, 'utf8'))
  const modules = new Map()

  for (const meta of Object.values(analyzer.nodeMetas || {})) {
    if (typeof meta.id !== 'string') {
      continue
    }

    const sizes = { ...EMPTY_SIZE }
    for (const partId of Object.values(meta.moduleParts || {})) {
      const part = analyzer.nodeParts?.[partId]
      if (part) {
        addSizes(sizes, {
          raw: part.renderedLength || 0,
          gzip: part.gzipLength || 0,
          brotli: part.brotliLength || 0
        })
      }
    }

    if (sizes.raw === 0 && sizes.gzip === 0 && sizes.brotli === 0) {
      continue
    }

    const id = normalizeModuleId(meta.id, root)
    const existing = modules.get(id) || { ...EMPTY_SIZE }
    modules.set(id, addSizes(existing, sizes))
  }

  return Object.fromEntries([...modules.entries()].sort(([a], [b]) => a.localeCompare(b)))
}

export async function buildSnapshot({ root, analyzePath, label, sha }) {
  const absoluteRoot = resolve(root)
  const publicDir = resolve(absoluteRoot, '.output/public')
  const assetDir = resolve(publicDir, '_nuxt')
  const assets = {}

  for (const path of await listFiles(assetDir)) {
    if (path.endsWith('.map') || path.endsWith('.br') || path.endsWith('.gz')) {
      continue
    }

    const file = normalizePath(relative(publicDir, path))
    assets[file] = {
      kind: assetKind(file),
      sizes: compressedSizes(await readFile(path))
    }
  }

  const totals = {
    javascript: { ...EMPTY_SIZE },
    css: { ...EMPTY_SIZE },
    other: { ...EMPTY_SIZE },
    all: { ...EMPTY_SIZE }
  }

  for (const asset of Object.values(assets)) {
    addSizes(totals[asset.kind], asset.sizes)
    addSizes(totals.all, asset.sizes)
  }

  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    label,
    sha,
    totals,
    modules: await readAnalyzerModules(resolve(analyzePath), absoluteRoot)
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validateKeys(value, expected, path) {
  const keys = Object.keys(value).sort()
  const sortedExpected = [...expected].sort()
  if (keys.length !== sortedExpected.length || keys.some((key, index) => key !== sortedExpected[index])) {
    throw new Error(`${path} contains unexpected fields`)
  }
}

function validateSize(value, path) {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`)
  }
  validateKeys(value, ['raw', 'gzip', 'brotli'], path)
  for (const key of ['raw', 'gzip', 'brotli']) {
    if (!Number.isSafeInteger(value[key]) || value[key] < 0) {
      throw new Error(`${path}.${key} must be a non-negative safe integer`)
    }
  }
}

export function validateSnapshot(snapshot, { label, sha } = {}) {
  if (!isRecord(snapshot)) {
    throw new Error('Snapshot must be an object')
  }
  validateKeys(snapshot, ['schemaVersion', 'label', 'sha', 'totals', 'modules'], 'Snapshot')

  if (snapshot.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) {
    throw new Error(`Unsupported snapshot schema version: ${snapshot.schemaVersion}`)
  }
  if (snapshot.label !== label) {
    throw new Error(`Expected a ${label} snapshot`)
  }
  if (!/^[0-9a-f]{40}$/.test(snapshot.sha)) {
    throw new Error('Snapshot SHA must be a lowercase 40-character hexadecimal string')
  }
  if (sha && snapshot.sha !== sha) {
    throw new Error(`${label} snapshot SHA does not match the triggering workflow`)
  }

  if (!isRecord(snapshot.totals)) {
    throw new Error('Snapshot totals must be an object')
  }
  validateKeys(snapshot.totals, ['javascript', 'css', 'other', 'all'], 'Snapshot totals')
  for (const key of ['javascript', 'css', 'other', 'all']) {
    validateSize(snapshot.totals[key], `Snapshot totals.${key}`)
  }
  for (const key of ['raw', 'gzip', 'brotli']) {
    const sum = snapshot.totals.javascript[key] + snapshot.totals.css[key] + snapshot.totals.other[key]
    if (snapshot.totals.all[key] !== sum) {
      throw new Error(`Snapshot totals.all.${key} is inconsistent`)
    }
  }

  if (!isRecord(snapshot.modules)) {
    throw new Error('Snapshot modules must be an object')
  }
  const modules = Object.entries(snapshot.modules)
  if (modules.length > MAX_MODULES) {
    throw new Error(`Snapshot contains more than ${MAX_MODULES} modules`)
  }
  for (const [id, sizes] of modules) {
    if (id.length === 0 || id.length > MAX_MODULE_ID_LENGTH || /[\p{Cc}\p{Cf}\p{Cs}]/u.test(id)) {
      throw new Error('Snapshot contains an invalid module identifier')
    }
    validateSize(sizes, `Snapshot module ${JSON.stringify(id)}`)
  }

  return snapshot
}

async function readSnapshot(path, expected) {
  const stats = await lstat(path)
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new Error('Snapshot path must be a regular file')
  }
  const contents = await readFile(path)
  if (contents.byteLength > MAX_SNAPSHOT_BYTES) {
    throw new Error(`Snapshot exceeds the ${MAX_SNAPSHOT_BYTES}-byte limit`)
  }
  return validateSnapshot(JSON.parse(contents.toString('utf8')), expected)
}

function formatBytes(bytes) {
  const absolute = Math.abs(bytes)
  if (absolute < 1024) {
    return `${bytes} B`
  }
  if (absolute < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
}

function formatDelta(base, head) {
  const delta = head - base
  if (delta === 0) {
    return '—'
  }

  const sign = delta > 0 ? '+' : ''
  const percentage = base === 0 ? '' : ` (${sign}${((delta / base) * 100).toFixed(1)}%)`
  return `${sign}${formatBytes(delta)}${percentage}`
}

function inlineCode(value) {
  const escaped = value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('@', '&#64;')
    .replaceAll('|', '&#124;')
    .replaceAll('`', '&#96;')
    .replaceAll('[', '&#91;')
    .replaceAll(']', '&#93;')
    .replaceAll('\r', ' ')
    .replaceAll('\n', ' ')
  return `<code>${escaped}</code>`
}

function metricRow(label, base, head) {
  return `| ${label} | ${formatBytes(base.brotli)} | ${formatBytes(head.brotli)} | ${formatDelta(base.brotli, head.brotli)} | ${formatDelta(base.gzip, head.gzip)} |`
}

function moduleRegressions(base, head) {
  const modules = new Set([...Object.keys(base.modules), ...Object.keys(head.modules)])
  return [...modules].map((id) => {
    const baseSize = Object.hasOwn(base.modules, id) ? base.modules[id] : EMPTY_SIZE
    const headSize = Object.hasOwn(head.modules, id) ? head.modules[id] : EMPTY_SIZE
    return {
      id,
      base: baseSize,
      head: headSize,
      delta: headSize.brotli - baseSize.brotli
    }
  }).filter(module => module.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 10)
}

export function compareSnapshots(base, head, expected = {}) {
  validateSnapshot(base, { label: 'base', sha: expected.baseSha })
  validateSnapshot(head, { label: 'pr', sha: expected.headSha })

  const lines = [
    '## Production bundle',
    '',
    `Comparing \`${base.sha.slice(0, 8)}\` with \`${head.sha.slice(0, 8)}\`. Compressed sizes are calculated from the emitted production assets.`,
    '',
    '| Metric | Base (Brotli) | PR (Brotli) | Δ Brotli | Δ gzip |',
    '| --- | ---: | ---: | ---: | ---: |',
    metricRow('Client JavaScript', base.totals.javascript, head.totals.javascript),
    metricRow('Client CSS', base.totals.css, head.totals.css),
    metricRow('Other client assets', base.totals.other, head.totals.other),
    metricRow('Total client assets', base.totals.all, head.totals.all)
  ]

  const regressions = moduleRegressions(base, head)
  if (regressions.length > 0) {
    lines.push(
      '',
      '### Largest module increases',
      '',
      '| Module | Base (Brotli) | PR (Brotli) | Δ Brotli |',
      '| --- | ---: | ---: | ---: |',
      ...regressions.map(module => `| ${inlineCode(module.id)} | ${formatBytes(module.base.brotli)} | ${formatBytes(module.head.brotli)} | ${formatDelta(module.base.brotli, module.head.brotli)} |`)
    )
  }

  lines.push('', '> Module values come from Nuxt’s analyzer and are attribution estimates. This workflow is currently report-only.')

  return `${lines.join('\n')}\n`
}

function parseArguments(argv) {
  const [command, ...args] = argv
  const options = {}

  for (let index = 0; index < args.length; index++) {
    const argument = args[index]
    if (!argument.startsWith('--')) {
      throw new Error(`Unexpected argument: ${argument}`)
    }

    const key = argument.slice(2)
    const value = args[++index]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`)
    }
    options[key] = value
  }

  return { command, options }
}

function required(options, key) {
  if (!options[key]) {
    throw new Error(`Missing required option --${key}`)
  }
  return options[key]
}

async function writeJson(path, value) {
  await mkdir(dirname(resolve(path)), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}

async function main() {
  const { command, options } = parseArguments(process.argv.slice(2))

  if (command === 'snapshot') {
    const snapshot = await buildSnapshot({
      root: required(options, 'root'),
      analyzePath: required(options, 'analyze'),
      label: required(options, 'label'),
      sha: required(options, 'sha')
    })
    await writeJson(required(options, 'output'), snapshot)
    return
  }

  if (command === 'compare') {
    const baseSha = required(options, 'base-sha')
    const headSha = required(options, 'head-sha')
    const base = await readSnapshot(required(options, 'base'), { label: 'base', sha: baseSha })
    const head = await readSnapshot(required(options, 'head'), { label: 'pr', sha: headSha })
    const output = required(options, 'output')
    await mkdir(dirname(resolve(output)), { recursive: true })
    await writeFile(output, compareSnapshots(base, head, { baseSha, headSha }))
    return
  }

  throw new Error('Expected the snapshot or compare command')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
