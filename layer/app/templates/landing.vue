<script setup lang="ts">
import type { Collections } from '@nuxt/content'
import { useCollectionName } from '../composables/useCollectionName'

const route = useRoute()

const collectionName = useCollectionName('landing')

const { data: page } = await useAsyncData(collectionName.value, () => queryCollection(collectionName.value as keyof Collections).path(route.path).first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.seo?.title || page.value.title
const description = page.value.seo?.description || page.value.description

useSeo({
  title,
  description,
  type: 'website',
  ogImage: page.value?.seo?.ogImage as string | undefined,
})

if (!page.value?.seo?.ogImage) {
  defineOgImageComponent('Landing', {
    title,
    description,
  })
}
</script>

<template>
  <ContentRenderer
    v-if="page"
    :value="page"
  />
</template>
