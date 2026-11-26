<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { getLocaleKey } from '../../../utils/locale'

defineProps<{
  navigation?: ContentNavigationItem[]
}>()

const { forced: forcedColorMode } = useDocusColorMode()
const { locale, isEnabled } = useDocusI18n()

if (import.meta.dev && useAppConfig().search?.fts !== undefined) {
  console.warn('[docus] `search.fts` in `app.config.ts` is deprecated: search always runs SQLite FTS5 in a web worker.')
}

// One source per locale, so the worker only downloads the current locale's snapshot
const { status, warmup, search } = useNuxtContentWorker({
  instances: () => [isEnabled.value ? `docs_${getLocaleKey(locale.value)}` : 'docs'],
})

// Loads the snapshot once the page is ready, so the first query doesn't wait for it
onNuxtReady(warmup)
</script>

<template>
  <LazyUContentSearch
    :navigation="navigation"
    :search="search"
    :search-status="status"
    :color-mode="!forcedColorMode"
  />
</template>
