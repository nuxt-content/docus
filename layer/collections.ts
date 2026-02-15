import { defineCollection } from '@nuxt/content'

export function defineDocusCollections(options: { basePath?: string, contentDir?: string, landing?: boolean } = {}) {
  const { contentDir = 'docs', basePath, landing = true } = options

  const collections: Record<string, ReturnType<typeof defineCollection>> = {
    docs: defineCollection({
      type: 'page',
      source: {
        include: `${contentDir}/**/*`,
        ...(basePath ? { prefix: basePath } : {}),
        ...(landing ? { exclude: [`${contentDir}/index.md`] } : {}),
      },
    }),
  }

  if (landing) {
    collections.landing = defineCollection({
      type: 'page',
      source: {
        include: `${contentDir}/index.md`,
        ...(basePath ? { prefix: basePath } : {}),
      },
    })
  }

  return collections
}
