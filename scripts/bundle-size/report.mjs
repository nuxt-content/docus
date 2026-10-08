import { constants, brotliCompressSync, gzipSync } from 'node:zlib'
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const EMPTY_SIZE = Object.freeze({ raw: 0, gzip: 0, brotli: 0 })
const SNAPSHOT_SCHEMA_VERSION = 3
const MAX_SNAPSHOT_BYTES = 5 * 1024 * 1024
const MAX_MODULES = 25_000
const MAX_MODULE_ID_LENGTH = 2_048
const MAX_ROUTE_FILES = 1_000

// Prerendered pages whose upfront assets are reported: landing, a light docs page, a component-heavy docs page.
const ROUTES = Object.freeze(['/en', '/en/getting-started/installation', '/en/essentials/components'])

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

function parseAttributes(source) {
  const attributes = {}
  for (const [, name, doubleQuoted, singleQuoted, unquoted] of source.matchAll(/([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    attributes[name.toLowerCase()] = doubleQuoted ?? singleQuoted ?? unquoted ?? ''
  }
  return attributes
}

// Prefetched chunks are left out: the browser only fetches them when idle.
export function initialAssetPaths(html) {
  const paths = new Set()

  for (const [, tag, source] of html.matchAll(/<(link|script)\b([^>]*)>/gi)) {
    const attributes = parseAttributes(source)
    const rel = (attributes.rel || '').toLowerCase().split(/\s+/)
    const url = tag.toLowerCase() === 'script'
      ? attributes.type === 'module' && attributes.src
      : (rel.includes('modulepreload') || rel.includes('stylesheet')) && attributes.href
    const index = url ? url.indexOf('_nuxt/') : -1
    if (index !== -1) {
      paths.add(url.slice(index).split(/[?#]/)[0])
    }
  }

  return paths
}

async function readRouteHtml(publicDir, route) {
  // `autoSubfolderIndex: false` writes `/en` as `en.html`, the Nitro default is `en/index.html`.
  for (const file of [`${route}.html`, `${route}/index.html`]) {
    try {
      return await readFile(resolve(publicDir, `.${file}`), 'utf8')
    }
    catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }
}

async function measureRoutes(publicDir, assets) {
  const routes = {}

  for (const route of ROUTES) {
    const html = await readRouteHtml(publicDir, route)
    if (html === undefined) {
      continue
    }

    const sizes = { javascript: { ...EMPTY_SIZE }, css: { ...EMPTY_SIZE }, files: 0 }
    for (const file of initialAssetPaths(html)) {
      const asset = Object.hasOwn(assets, file) ? assets[file] : undefined
      if (asset && asset.kind !== 'other') {
        addSizes(sizes[asset.kind], asset.sizes)
        sizes.files++
      }
    }
    routes[route] = sizes
  }

  return routes
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
    routes: await measureRoutes(publicDir, assets),
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
  validateKeys(snapshot, ['schemaVersion', 'label', 'sha', 'totals', 'routes', 'modules'], 'Snapshot')

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

  if (!isRecord(snapshot.routes)) {
    throw new Error('Snapshot routes must be an object')
  }
  for (const [route, sizes] of Object.entries(snapshot.routes)) {
    if (!ROUTES.includes(route)) {
      throw new Error('Snapshot contains an unexpected route')
    }
    const path = `Snapshot route ${JSON.stringify(route)}`
    if (!isRecord(sizes)) {
      throw new Error(`${path} must be an object`)
    }
    validateKeys(sizes, ['javascript', 'css', 'files'], path)
    validateSize(sizes.javascript, `${path}.javascript`)
    validateSize(sizes.css, `${path}.css`)
    if (!Number.isSafeInteger(sizes.files) || sizes.files < 0 || sizes.files > MAX_ROUTE_FILES) {
      throw new Error(`${path}.files must be an integer between 0 and ${MAX_ROUTE_FILES}`)
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

function formatCountDelta(base, head) {
  const delta = head - base
  if (delta === 0) {
    return '—'
  }
  return delta > 0 ? `+${delta}` : String(delta)
}

function routeRows(base, head) {
  return ROUTES.filter(route => Object.hasOwn(base.routes, route) || Object.hasOwn(head.routes, route)).map((route) => {
    const baseRoute = Object.hasOwn(base.routes, route) ? base.routes[route] : undefined
    const headRoute = Object.hasOwn(head.routes, route) ? head.routes[route] : undefined
    const baseJs = baseRoute ? formatBytes(baseRoute.javascript.brotli) : 'n/a'
    const headJs = headRoute ? formatBytes(headRoute.javascript.brotli) : 'n/a'
    if (!baseRoute || !headRoute) {
      return `| ${inlineCode(route)} | ${baseJs} | ${headJs} | n/a | n/a | n/a |`
    }
    return `| ${inlineCode(route)} | ${baseJs} | ${headJs} | ${formatDelta(baseRoute.javascript.brotli, headRoute.javascript.brotli)} | ${formatDelta(baseRoute.css.brotli, headRoute.css.brotli)} | ${formatCountDelta(baseRoute.files, headRoute.files)} |`
  })
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
    `Comparing \`${base.sha.slice(0, 8)}\` with \`${head.sha.slice(0, 8)}\`. Compressed sizes are calculated from the emitted production assets.`
  ]

  const routes = routeRows(base, head)
  if (routes.length > 0) {
    lines.push(
      '',
      '### Initial page load',
      '',
      '| Page | Base JS (Brotli) | PR JS (Brotli) | Δ JS | Δ CSS | Δ files |',
      '| --- | ---: | ---: | ---: | ---: | ---: |',
      ...routes,
      '',
      '> Entry script, `modulepreload` chunks and stylesheets referenced by the prerendered HTML. Lazy and prefetched chunks are excluded.'
    )
  }

  lines.push(
    '',
    '### All client assets',
    '',
    '| Metric | Base (Brotli) | PR (Brotli) | Δ Brotli | Δ gzip |',
    '| --- | ---: | ---: | ---: | ---: |',
    metricRow('Client JavaScript', base.totals.javascript, head.totals.javascript),
    metricRow('Client CSS', base.totals.css, head.totals.css),
    metricRow('Other client assets', base.totals.other, head.totals.other),
    metricRow('Total client assets', base.totals.all, head.totals.all)
  )

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
