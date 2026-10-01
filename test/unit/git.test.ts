import { afterEach, describe, expect, it, vi } from 'vitest'
import { getGitBranch, getGitEnv } from '../../layer/utils/git'

const GIT_ENV = [
  'CF_PAGES_BRANCH',
  'CI_COMMIT_BRANCH',
  'VERCEL_GIT_COMMIT_REF',
  'BRANCH',
  'GITHUB_REF_NAME',
  'VERCEL_GIT_PROVIDER',
  'VERCEL_GIT_REPO_OWNER',
  'VERCEL_GIT_REPO_SLUG',
  'GITHUB_SERVER_URL',
  'GITHUB_REPOSITORY_OWNER',
  'GITHUB_REPOSITORY',
  'CI_PROJECT_PATH',
  'REPOSITORY_URL',
]

function clearGitEnv() {
  for (const key of GIT_ENV) vi.stubEnv(key, '')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getGitBranch', () => {
  it('reads the Vercel branch', () => {
    clearGitEnv()
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'feat/search')
    expect(getGitBranch()).toBe('feat/search')
  })

  it('ignores a detached `HEAD` env value', () => {
    clearGitEnv()
    vi.stubEnv('GITHUB_REF_NAME', 'HEAD')
    expect(getGitBranch()).not.toBe('HEAD')
  })
})

describe('getGitEnv', () => {
  it('builds the repository URL from Vercel env', () => {
    clearGitEnv()
    vi.stubEnv('VERCEL_GIT_PROVIDER', 'github')
    vi.stubEnv('VERCEL_GIT_REPO_OWNER', 'nuxt-content')
    vi.stubEnv('VERCEL_GIT_REPO_SLUG', 'docus')
    expect(getGitEnv()).toEqual({ owner: 'nuxt-content', name: 'docus', url: 'https://github.com/nuxt-content/docus' })
  })

  it('builds the repository URL from GitHub Actions env', () => {
    clearGitEnv()
    vi.stubEnv('GITHUB_SERVER_URL', 'https://github.com')
    vi.stubEnv('GITHUB_REPOSITORY_OWNER', 'nuxt-content')
    vi.stubEnv('GITHUB_REPOSITORY', 'nuxt-content/docus')
    expect(getGitEnv()).toEqual({ owner: 'nuxt-content', name: 'docus', url: 'https://github.com/nuxt-content/docus' })
  })

  it('parses owner and name from a bare repository URL', () => {
    clearGitEnv()
    vi.stubEnv('REPOSITORY_URL', 'https://github.com/nuxt-content/docus')
    expect(getGitEnv()).toEqual({ owner: 'nuxt-content', name: 'docus', url: 'https://github.com/nuxt-content/docus' })
  })

  it('returns empty values without any env', () => {
    clearGitEnv()
    expect(getGitEnv()).toEqual({ owner: '', name: '', url: '' })
  })
})
