import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPackageJsonMetadata, inferSiteURL } from '../../layer/utils/meta'

const SITE_ENV = [
  'NUXT_PUBLIC_SITE_URL',
  'NUXT_SITE_URL',
  'VERCEL_PROJECT_PRODUCTION_URL',
  'VERCEL_BRANCH_URL',
  'VERCEL_URL',
  'URL',
  'CI_PAGES_URL',
  'CF_PAGES_URL',
]

function clearSiteEnv() {
  for (const key of SITE_ENV) vi.stubEnv(key, '')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('inferSiteURL', () => {
  it('returns undefined without any env', () => {
    clearSiteEnv()
    expect(inferSiteURL()).toBeUndefined()
  })

  it('adds https to bare Vercel hostnames', () => {
    clearSiteEnv()
    vi.stubEnv('VERCEL_URL', 'docus-abc123.vercel.app')
    expect(inferSiteURL()).toBe('https://docus-abc123.vercel.app')
  })

  it('prefers the production URL over the deployment URL on Vercel', () => {
    clearSiteEnv()
    vi.stubEnv('VERCEL_URL', 'docus-abc123.vercel.app')
    vi.stubEnv('VERCEL_BRANCH_URL', 'docus-git-feat.vercel.app')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'docus.dev')
    expect(inferSiteURL()).toBe('https://docus.dev')
  })

  it('lets the Nuxt site URL win over platform env', () => {
    clearSiteEnv()
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'docus.dev')
    vi.stubEnv('NUXT_PUBLIC_SITE_URL', 'https://docs.example.com')
    expect(inferSiteURL()).toBe('https://docs.example.com')
  })
})

describe('getPackageJsonMetadata', () => {
  it('reads name, description and version', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'docus-meta-'))
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'my-docs', description: 'Docs', version: '1.2.3', private: true }))
    try {
      expect(await getPackageJsonMetadata(dir)).toEqual({ name: 'my-docs', description: 'Docs', version: '1.2.3' })
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('falls back to `docs` without a package.json', async () => {
    expect(await getPackageJsonMetadata(join(tmpdir(), 'docus-does-not-exist'))).toEqual({ name: 'docs' })
  })
})
