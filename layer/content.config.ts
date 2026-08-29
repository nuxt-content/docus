import type { DefinedCollection } from '@nuxt/content'
import { defineContentConfig, defineCollection, z } from '@nuxt/content'
import { useNuxt } from '@nuxt/kit'
import { joinURL } from 'ufo'
import { landingPageExists, docsFolderExists, findLocaleFolder } from './utils/pages'
import { getLocaleKey, normalizeLocale } from './utils/locale'

const { options } = useNuxt()
const cwd = joinURL(options.rootDir, 'content')
const locales = options.i18n?.locales

const hasLandingPage = landingPageExists(options.rootDir)
const hasDocsFolder = docsFolderExists(options.rootDir)

const createDocsSchema = () => z.object({
  links: z.array(z.object({
    label: z.string(),
    icon: z.string(),
    to: z.string(),
    target: z.string().optional(),
  })).optional(),
})

let collections: Record<string, DefinedCollection>

if (locales && Array.isArray(locales)) {
  collections = {}
  for (const locale of locales) {
    const code = normalizeLocale(typeof locale === 'string' ? locale : locale.code)
    const collectionKey = getLocaleKey(code)
    const dir = findLocaleFolder(options.rootDir, code) || code
    const hasLocaleDocs = docsFolderExists(options.rootDir, dir)

    if (!hasLandingPage) {
      collections[`landing_${collectionKey}`] = defineCollection({
        type: 'page',
        source: {
          cwd,
          include: `${dir}/index.md`,
        },
      })
    }

    collections[`docs_${collectionKey}`] = defineCollection({
      type: 'page',
      source: {
        cwd,
        include: hasLocaleDocs ? `${dir}/docs/**` : `${dir}/**/*`,
        prefix: hasLocaleDocs ? `/${code}/docs` : `/${code}`,
        exclude: [`${dir}/index.md`],
      },
      schema: createDocsSchema(),
    })
  }
}
else {
  collections = {
    docs: defineCollection({
      type: 'page',
      source: {
        cwd,
        include: hasDocsFolder ? 'docs/**' : '**',
        prefix: hasDocsFolder ? '/docs' : '/',
        exclude: ['index.md'],
      },
      schema: createDocsSchema(),
    }),
  }

  // Only define landing collection if user doesn't have their own index.vue
  if (!hasLandingPage) {
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
