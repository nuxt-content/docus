import type { DefinedCollection } from '@nuxt/content'
import { defineContentConfig, defineCollection, z } from '@nuxt/content'
import { useNuxt } from '@nuxt/kit'
import { joinURL } from 'ufo'
import { landingPageExists, docsFolderExists, versionDocsFolderExists } from './utils/pages'
import type { DocusVersionsConfig, DocusVersionItem } from './modules/config'

const { options } = useNuxt()
const cwd = joinURL(options.rootDir, 'content')
const locales = options.i18n?.locales
const versionsConfig = (options as typeof options & { docus?: { versions?: DocusVersionsConfig } }).docus?.versions
const versions = versionsConfig?.items
const versionStrategy = versionsConfig?.strategy || 'prefix'

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

function buildVersionedSource(version: DocusVersionItem, code?: string): Record<string, unknown> {
  const v = version.value

  if (version.source?.repository) {
    const source: Record<string, unknown> = {
      repository: version.source.repository,
      include: version.source.include || 'docs/**',
      prefix: versionStrategy === 'prefix'
        ? (code ? `/${code}/${v}/docs` : `/${v}/docs`)
        : (code ? `/${code}/docs` : '/docs'),
    }
    if (version.source.branch) source.branch = version.source.branch
    if (version.source.tag) source.tag = version.source.tag
    return source
  }

  if (code) {
    const hasVersionLocaleDocs = versionDocsFolderExists(options.rootDir, v, code)
    return {
      cwd,
      include: hasVersionLocaleDocs ? `${v}/${code}/docs/**` : `${v}/${code}/**/*`,
      exclude: [`${v}/${code}/index.md`],
      prefix: versionStrategy === 'prefix'
        ? (hasVersionLocaleDocs ? `/${code}/${v}/docs` : `/${code}/${v}`)
        : (hasVersionLocaleDocs ? `/${code}/docs` : `/${code}`),
    }
  }

  const hasVersionDocs = versionDocsFolderExists(options.rootDir, v)
  return {
    cwd,
    include: hasVersionDocs ? `${v}/docs/**` : `${v}/**`,
    exclude: [`${v}/index.md`],
    prefix: versionStrategy === 'prefix'
      ? (hasVersionDocs ? `/${v}/docs` : `/${v}`)
      : (hasVersionDocs ? '/docs' : '/'),
  }
}

let collections: Record<string, DefinedCollection>

if (versions?.length) {
  collections = {}

  if (locales && Array.isArray(locales)) {
    for (const version of versions) {
      for (const locale of locales) {
        const code = (typeof locale === 'string' ? locale : locale.code).replace('-', '_')

        collections[`docs_${version.value}_${code}`] = defineCollection({
          type: 'page',
          source: buildVersionedSource(version, code) as Parameters<typeof defineCollection>[0]['source'],
          schema: createDocsSchema(),
        })
      }
    }

    // Landing pages are not versioned — one per locale
    if (!hasLandingPage) {
      for (const locale of locales) {
        const code = (typeof locale === 'string' ? locale : locale.code).replace('-', '_')
        collections[`landing_${code}`] = defineCollection({
          type: 'page',
          source: {
            cwd,
            include: `${code}/index.md`,
          },
        })
      }
    }
  }
  else {
    for (const version of versions) {
      collections[`docs_${version.value}`] = defineCollection({
        type: 'page',
        source: buildVersionedSource(version) as Parameters<typeof defineCollection>[0]['source'],
        schema: createDocsSchema(),
      })
    }

    // Landing page is not versioned
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
}
else if (locales && Array.isArray(locales)) {
  collections = {}
  for (const locale of locales) {
    const code = (typeof locale === 'string' ? locale : locale.code).replace('-', '_')
    const hasLocaleDocs = docsFolderExists(options.rootDir, code)

    if (!hasLandingPage) {
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
        include: hasLocaleDocs ? `${code}/docs/**` : `${code}/**/*`,
        prefix: hasLocaleDocs ? `/${code}/docs` : `/${code}`,
        exclude: [`${code}/index.md`],
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
