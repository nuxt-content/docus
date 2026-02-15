<script setup lang="ts">
import type { ContentNavigationItem, PageCollections } from '@nuxt/content'

const { basePath } = useDocusConfig()
const { locale, isEnabled } = useDocusI18n()
const { isEnabled: isAssistantEnabled, panelWidth: assistantPanelWidth, shouldPushContent } = useAssistant()

const collectionName = computed(() => isEnabled.value ? `docs_${locale.value}` : 'docs')

const { data: navigation } = await useAsyncData(() => `docus_navigation_${collectionName.value}`, () => queryCollectionNavigation(collectionName.value as keyof PageCollections), {
  transform: (data: ContentNavigationItem[]) => {
    const rootResult = data.find(item => item.path === basePath)?.children || data || []

    return rootResult.find((item: ContentNavigationItem) => item.path === `/${locale.value}`)?.children || rootResult
  },
  watch: [locale],
})
const { data: files } = useLazyAsyncData(`docus_search_${collectionName.value}`, () => queryCollectionSearchSections(collectionName.value as keyof PageCollections), {
  server: false,
  watch: [locale],
})

provide('navigation', navigation)
</script>

<template>
  <div
    class="transition-[margin-right] duration-200 ease-linear will-change-[margin-right]"
    :style="{ marginRight: shouldPushContent ? `${assistantPanelWidth}px` : '0' }"
  >
    <AppHeader />

    <UMain>
      <UContainer>
        <UPage>
          <template #left>
            <UPageAside>
              <DocsAsideLeftTop />
              <DocsAsideLeftBody />
            </UPageAside>
          </template>
          <slot />
        </UPage>
      </UContainer>
    </UMain>

    <AppFooter />
  </div>

  <ClientOnly>
    <LazyUContentSearch
      :files="files"
      :navigation="navigation"
    />
    <template v-if="isAssistantEnabled">
      <LazyAssistantPanel />
      <LazyAssistantFloatingInput />
    </template>
  </ClientOnly>
</template>
