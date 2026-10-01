import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const layerDir = fileURLToPath(new URL('../../layer/', import.meta.url))
const { files } = JSON.parse(readFileSync(`${layerDir}package.json`, 'utf8')) as { files: string[] }

// Build output, local state and files npm always ships or that only matter in the repo.
const IGNORED = new Set(['node_modules', 'package.json', 'tsconfig.json'])

describe('layer package.json `files`', () => {
  const entries = readdirSync(layerDir).filter(entry => !entry.startsWith('.') && !IGNORED.has(entry))

  it.each(entries)('publishes `%s`', (entry) => {
    expect(files).toContain(entry)
  })
})
