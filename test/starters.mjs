// Smoke test for the published starters against the local `layer`.
//
// For each starter in `.starters/*` it:
//   1. copies the starter into a temp dir (so the repo stays clean),
//   2. rewrites its `docus` dependency to a `link:` to the local `layer`,
//      so we test the current branch's layer exactly as a user extends it,
//   3. installs standalone (`--ignore-workspace`),
//   4. runs `nuxt build` (production server bundle) and `nuxt generate`
//      (static prerender), then asserts the generated home page rendered the
//      docus hero. If the layer fails to extend, that markup is absent.
//
// Usage: `node test/starters.mjs [default] [i18n]` (defaults to all).

import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const layerDir = join(repoRoot, 'layer')
const startersDir = join(repoRoot, '.starters')

// Stable marker rendered by the starters' `content/index.md` hero. It only
// appears if the docus layer extended and Content + MDC + Nuxt UI rendered.
const HERO_MARKER = 'Write beautiful docs with Markdown'

// Paths we never want to copy from the source starter.
const SKIP_COPY = /(?:^|\/)(?:node_modules|\.nuxt|\.output|\.data|\.cache|dist)(?:\/|$)|\.tgz$/

const requested = process.argv.slice(2)
const all = readdirSync(startersDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
const starters = requested.length ? requested : all

for (const name of starters) {
  if (!all.includes(name)) {
    console.error(`✗ unknown starter "${name}" (available: ${all.join(', ')})`)
    process.exit(1)
  }
}

function run(cmd, args, cwd, env) {
  console.log(`\n  $ ${cmd} ${args.join(' ')}`)
  execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } })
}

// The docus production build (sqlite wasm, og-image, takumi, full UI) is heavy
// enough to exhaust the default V8 heap, so give the Nuxt steps more headroom.
const buildEnv = { NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --max-old-space-size=8192`.trim() }

/** Recursively collect the contents of every prerendered .html file. */
function readGeneratedHtml(dir) {
  let html = ''
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) html += readGeneratedHtml(full)
    else if (entry.name.endsWith('.html')) html += readFileSync(full, 'utf8')
  }
  return html
}

const failures = []

for (const name of starters) {
  const src = join(startersDir, name)
  const work = mkdtempSync(join(tmpdir(), `docus-starter-${name}-`))
  console.log(`\n=== starter: ${name} ===\n  workdir: ${work}`)

  try {
    cpSync(src, work, { recursive: true, filter: s => !SKIP_COPY.test(s) })

    // Point `docus` at the local layer so we test the current branch's layer
    // exactly as a user extends it from npm.
    const pkgPath = join(work, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    pkg.dependencies.docus = `link:${layerDir}`
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

    // A dedicated pnpm-workspace.yaml makes the temp dir its own workspace root
    // (decoupled from this repo) and pre-decides which native build scripts may
    // run — pnpm errors on undecided builds in CI. The keys mirror the repo's
    // own pnpm-workspace.yaml: `allowBuilds` is honoured by pnpm 11.1.x while
    // `onlyBuiltDependencies`/`ignoredBuiltDependencies` cover newer pnpm.
    writeFileSync(join(work, 'pnpm-workspace.yaml'), [
      'packages: []',
      'onlyBuiltDependencies:',
      '  - better-sqlite3',
      '  - sharp',
      'ignoredBuiltDependencies:',
      '  - \'@parcel/watcher\'',
      '  - \'@tailwindcss/oxide\'',
      '  - esbuild',
      '  - unrs-resolver',
      '  - vue-demi',
      'allowBuilds:',
      '  \'@parcel/watcher\': false',
      '  \'@tailwindcss/oxide\': false',
      '  better-sqlite3: true',
      '  esbuild: false',
      '  sharp: true',
      '  unrs-resolver: false',
      '  vue-demi: false',
      '',
    ].join('\n'))

    run('pnpm', ['install', '--no-frozen-lockfile'], work)
    run('pnpm', ['exec', 'nuxt', 'build'], work, buildEnv)
    run('pnpm', ['exec', 'nuxt', 'generate'], work, buildEnv)

    const html = readGeneratedHtml(join(work, '.output', 'public'))
    if (!html.includes(HERO_MARKER)) {
      throw new Error(`generated HTML does not contain the docus hero ("${HERO_MARKER}") — the layer likely failed to extend`)
    }

    console.log(`\n✓ starter "${name}" built, generated, and rendered the docus home`)
  }
  catch (error) {
    failures.push(`${name}: ${error.message}`)
    console.error(`\n✗ starter "${name}" failed: ${error.message}`)
  }
  finally {
    rmSync(work, { recursive: true, force: true })
  }
}

console.log(`\n${'='.repeat(48)}`)
if (failures.length) {
  console.error(`✗ ${failures.length}/${starters.length} starter(s) failed:`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`✓ all ${starters.length} starter(s) passed`)
