import type { DefinedCollection } from '@nuxt/content'
import { defineContentConfig, defineCollection } from '@nuxt/content'
import { useNuxt } from '@nuxt/kit'
import { joinURL } from 'ufo'

const { options } = useNuxt()
const cwd = joinURL(options.rootDir, 'content')
const locales = options.i18n?.locales

const docusConfig = options.docus as { basePath?: string, landing?: boolean } | undefined
const basePath = docusConfig?.basePath || '/'
const landing = docusConfig?.landing ?? (basePath === '/')

let collections: Record<string, DefinedCollection>

if (locales && Array.isArray(locales)) {
  collections = {}
  for (const locale of locales) {
    const code = (typeof locale === 'string' ? locale : locale.code).replace('-', '_')

    if (landing) {
      collections[`landing_${code}`] = defineCollection({
        type: 'page',
        source: {
          cwd,
          include: `${code}/index.md`,
        },
      })
    }

    collections[`docs_${code}`] = defineCollection({
      type: 'page',
      source: {
        cwd,
        include: `${code}/**/*`,
        prefix: `/${code}`,
        ...(landing ? { exclude: [`${code}/index.md`] } : {}),
      },
    })
  }
}
else {
  collections = {
    docs: defineCollection({
      type: 'page',
      source: {
        cwd,
        include: '**',
        ...(landing ? { exclude: ['index.md'] } : {}),
      },
    }),
  }

  if (landing) {
    collections.landing = defineCollection({
      type: 'page',
      source: {
        cwd,
        include: 'index.md',
      },
    })
  }
}

export default defineContentConfig({ collections })
