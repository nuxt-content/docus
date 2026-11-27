<script setup lang="ts">
import type { DocsPage } from '../types'

const route = useRoute()

const { data: page } = await useAsyncData(`landing-${route.path}`, () => content.get<DocsPage['data']>(route.path) as Promise<DocsPage | null>)
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.data.seo?.title || page.value.data.title || page.value.meta.title
const description = page.value.data.seo?.description || page.value.data.description || page.value.meta.description

useSeo({
  title,
  description,
  type: 'website',
  ogImage: page.value?.data.seo?.ogImage as string | undefined,
})

if (!page.value?.data.seo?.ogImage) {
  defineOgImage('Landing', {
    title: formatOgTitle(title),
    description: formatOgDescription(title, description),
  })
}
</script>

<template>
  <ContentDocument
    v-if="page"
    :value="page"
  />
</template>
