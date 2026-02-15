import { defineCollection } from '@nuxt/content'

export function defineDocusCollections(options: { basePath?: string, contentDir?: string, landing?: boolean } = {}) {
  const { contentDir = 'docs', basePath, landing = true } = options

  // Only use prefix when basePath differs from contentDir (e.g. contentDir: 'docs' but basePath: '/documentation')
  // When they match, the directory structure already produces the correct paths
  const needsPrefix = basePath != null && basePath !== `/${contentDir}`

  const collections: Record<string, ReturnType<typeof defineCollection>> = {
    docs: defineCollection({
      type: 'page',
      source: {
        include: `${contentDir}/**/*`,
        ...(needsPrefix ? { prefix: basePath } : {}),
        ...(landing ? { exclude: [`${contentDir}/index.md`] } : {}),
      },
    }),
  }

  if (landing) {
    collections.landing = defineCollection({
      type: 'page',
      source: {
        include: `${contentDir}/index.md`,
        ...(needsPrefix ? { prefix: basePath } : {}),
      },
    })
  }

  return collections
}
