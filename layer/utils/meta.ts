import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { withHttps } from 'ufo'

export function inferSiteURL() {
  // https://github.com/unjs/std-env/issues/59
  const url = (
    process.env.NUXT_PUBLIC_SITE_URL // Nuxt public runtime config
    || process.env.NUXT_SITE_URL // Nuxt site config
    || process.env.VERCEL_PROJECT_PRODUCTION_URL // Vercel production URL
    || process.env.VERCEL_BRANCH_URL // Vercel branch URL
    || process.env.VERCEL_URL // Vercel deployment URL
    || process.env.URL // Netlify
    || process.env.CI_PAGES_URL // Gitlab Pages
    || process.env.CF_PAGES_URL // Cloudflare Pages
  )

  return url ? withHttps(url) : undefined
}

export async function getPackageJsonMetadata(dir: string) {
  try {
    const packageJson = await readFile(resolve(dir, 'package.json'), 'utf-8')
    const parsed = JSON.parse(packageJson)
    return {
      name: parsed.name,
      description: parsed.description,
      version: parsed.version,
    }
  }
  catch {
    return {
      name: 'docs',
    }
  }
}
