<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

defineProps<{
  navigation?: ContentNavigationItem[]
}>()

const { forced: forcedColorMode } = useDocusColorMode()

if (import.meta.dev && useAppConfig().search?.fts !== undefined) {
  console.warn('[docus] `search.fts` in `app.config.ts` is deprecated: search always runs SQLite FTS5 in a web worker.')
}
</script>

<template>
  <LazyUContentSearch
    :navigation="navigation"
    :color-mode="!forcedColorMode"
  />
</template>
