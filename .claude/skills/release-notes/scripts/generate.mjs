#!/usr/bin/env node
// Draft the body of the open uppt release PR with Highlights / New documentation placeholders for the model.
// uppt writes the changelog and contributors below `## 👉 Changelog` and keeps everything above it.
//
// Usage: node .claude/skills/release-notes/scripts/generate.mjs [pr-number]
// - pr-number: optional, needed only when several release PRs are open (stable and prerelease).
// - Writes v<version>.md at the repo root and prints a digest to stdout.

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO = 'nuxt-content/docus'
const DOCS_URL = 'https://docus.dev'
const DOCS_DIR = 'docs/content/en'
const CHANGELOG_HEADING = '## 👉 Changelog'

function sh(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
}

const repoRoot = sh('git', ['rev-parse', '--show-toplevel'])

// --- Locate the release PR -----------------------------------------------------
const prs = JSON.parse(sh('gh', ['pr', 'list', '--repo', REPO, '--state', 'open', '--json', 'number,headRefName,body,url']))
  .filter(pr => pr.headRefName.startsWith('release/v'))
const wantPr = process.argv[2]?.replace(/^#/, '')
const pr = wantPr ? prs.find(p => String(p.number) === wantPr) : prs.length === 1 ? prs[0] : null
if (!pr) {
  console.error(prs.length
    ? `Pass one of the open release PRs: ${prs.map(p => `#${p.number} (${p.headRefName})`).join(', ')}`
    : 'No open release/v* PR. uppt opens one on the next push to main.')
  process.exit(1)
}

// uppt keeps the compare link in sync with the version on the release branch.
const [, prevTag, newTag] = pr.body.match(/compare\/(v\S+?)\.\.\.(v[^)\s]+)\)/) ?? []
if (!prevTag) {
  console.error(`Could not find the compare link in #${pr.number}. Has uppt finished writing the PR?`)
  process.exit(1)
}
const version = newTag.slice(1)
// Patch releases (x.y.z with z > 0) have no Highlights.
const isPatch = Number(version.split(/[.-]/)[2]) > 0

sh('git', ['fetch', '--quiet', 'origin', `+refs/tags/${prevTag}:refs/tags/${prevTag}`, `+refs/heads/${pr.headRefName}:refs/remotes/origin/${pr.headRefName}`])
const ref = `origin/${pr.headRefName}`
const range = `${prevTag}..${ref}`

// --- Highlight candidates: features, performance and breaking changes -----------
const changelogStart = pr.body.indexOf(CHANGELOG_HEADING)
const preamble = (changelogStart === -1 ? pr.body : pr.body.slice(0, changelogStart)).trim()
const changelog = changelogStart === -1 ? '' : pr.body.slice(changelogStart)

const candidates = []
let section = null
for (const line of changelog.split('\n')) {
  const h = line.match(/^### (.+)$/)
  if (h) section = h[1].trim()
  else if (line.startsWith('- ') && (/Enhancements|Performance/.test(section) || line.includes('⚠️')))
    candidates.push(`[${section}] ${line.slice(2)}`)
}

// --- New documentation candidates ---------------------------------------------
// Numeric prefixes are dropped from URLs: 4.ai/1.assistant.md -> /en/ai/assistant.
const toUrl = path => `${DOCS_URL}/${path
  .replace(/^docs\/content\//, '')
  .replace(/\.md$/, '')
  .split('/')
  .map(s => s.replace(/^\d+\./, ''))
  .filter(s => s !== 'index')
  .join('/')}`

const slugify = text => text
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s-]/gu, '')
  .trim()
  .replace(/\s+/g, '-')

// Code fences are skipped since docs pages contain markdown examples with headings.
const headings = (src) => {
  const found = []
  let fence = null
  for (const line of src.split('\n')) {
    const marker = line.trim().match(/^(?:`{3,}|~{3,})/)?.[0]
    if (marker && !fence) {
      fence = marker
    }
    else if (fence) {
      if (line.trim() === fence) fence = null
    }
    else {
      const h = line.match(/^#{2,3} (.+)$/)
      if (h) found.push(h[1].trim())
    }
  }
  return found
}

const show = (rev, path) => {
  try {
    return sh('git', ['show', `${rev}:${path}`])
  }
  catch {
    return ''
  }
}

const newPages = []
const newSections = []
try {
  const changes = sh('git', ['diff', '--name-status', '-M', range, '--', DOCS_DIR])
    .split('\n')
    .filter(Boolean)
    .map(l => l.split('\t'))
  for (const [status, from, to = from] of changes) {
    if (!to.endsWith('.md')) continue
    if (status === 'A') {
      newPages.push(toUrl(to))
    }
    else if (status === 'M' || status.startsWith('R')) {
      const before = new Set(headings(show(prevTag, from)))
      for (const h of headings(show(ref, to))) {
        if (!before.has(h)) newSections.push(`${toUrl(to)}#${slugify(h)}`)
      }
    }
  }
}
catch { /* no docs changes in range */ }
const hasDocsCandidates = newPages.length + newSections.length > 0

// --- Co-authors: uppt lists commit authors only -----------------------------------
const coAuthors = [...new Set(sh('git', ['log', range, '--pretty=%(trailers:key=Co-authored-by,valueonly)'])
  .split('\n')
  .map(l => l.trim())
  .filter(l => l && !/\[bot\]|amp@ampcode\.com|noreply@anthropic\.com/i.test(l)))]

// --- Assemble the PR body ------------------------------------------------------
const hasSection = title => preamble.includes(`## ${title}`)
const out = [preamble, '']
if (!isPatch && !hasSection('✨ Highlights')) {
  out.push('## ✨ Highlights', '', '<!-- TODO: write 2-4 highlights here (see SKILL.md). Delete this comment when done. -->', '')
}
if (hasDocsCandidates && !hasSection('📚 New documentation')) {
  out.push('## 📚 New documentation', '', '<!-- TODO: keep the pages and sections that shipped (see SKILL.md), or delete this section. -->', '')
}
out.push(changelog.trim(), '')

const outPath = join(repoRoot, `${newTag}.md`)
writeFileSync(outPath, out.join('\n'))

// --- Digest to help write the judgement parts ---------------------------------
console.log(`\n✓ Wrote ${outPath}`)
console.log(`  ${pr.url}  •  ${newTag}  •  previous ${prevTag}  •  range ${range}\n`)

if (isPatch) {
  console.log('Patch release: no Highlights section.')
}
else {
  console.log('Highlight candidates (curate 2-4 of these):')
  for (const c of candidates) console.log(`  ${c}`)
}

if (hasDocsCandidates) {
  console.log('\nNew documentation candidates (keep only what documents this release):')
  for (const url of newPages) console.log(`  [page] ${url}`)
  for (const url of newSections) console.log(`  [section] ${url}`)
}
else if (isPatch) {
  console.log('No docs changes: the PR body needs no edit.')
}

if (coAuthors.length) {
  console.log('\nCo-authors (check they are in the Contributors list):')
  for (const c of coAuthors) console.log(`  ${c}`)
}
