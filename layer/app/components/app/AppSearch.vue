<script setup lang="ts">
import type { ContentNavigationItem, PageCollections } from '@nuxt/content'

const props = defineProps<{
  navigation?: ContentNavigationItem[]
}>()

const appConfig = useAppConfig()
const { forced: forcedColorMode } = useDocusColorMode()
const { locale, isEnabled } = useDocusI18n()

const collectionName = computed(() => isEnabled.value ? `docs_${locale.value}` : 'docs')
const useFts = (appConfig.search as { fts?: boolean })?.fts

const { data: files } = useFts
  ? { data: ref(null) }
  : useLazyAsyncData(`search_${collectionName.value}`, () => queryCollectionSearchSections(collectionName.value as keyof PageCollections), {
      server: false,
      watch: [locale],
    })

const { search, status: searchStatus, init } = useFts
  ? useSearchCollection(collectionName as unknown as ComputedRef<keyof PageCollections>, { immediate: false, ignoredTags: ['style'] })
  : { search: undefined, status: ref(undefined), init: () => {} }

if (useFts) {
  const { open } = useContentSearch()
  watch(open, (value) => {
    if (value && searchStatus.value === 'idle') {
      init()
    }
  })
}

const links = computed(() => useFts
  ? props.navigation?.filter(item => item.children?.length).map(item => ({
      label: item.title,
      icon: item.icon,
      to: item.children![0]!.path,
    }))
  : undefined,
)
</script>

<template>
  <LazyUContentSearch
    :files="files"
    :search="search"
    :search-status="searchStatus"
    :links="links"
    :navigation="navigation"
    :color-mode="!forcedColorMode"
  />
</template>
