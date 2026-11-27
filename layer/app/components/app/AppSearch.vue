<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { getLocaleKey } from '../../../utils/locale'

const props = defineProps<{
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

// With `search`, the palette hides the navigation until a query is typed, so list the main sections
const links = computed(() => props.navigation?.filter(item => item.children?.length).map(item => ({
  label: item.title,
  icon: item.icon as string | undefined,
  to: item.children![0]!.path,
})))
</script>

<template>
  <LazyUContentSearch
    :navigation="navigation"
    :search="search"
    :search-status="status"
    :links="links"
    :color-mode="!forcedColorMode"
  />
</template>
