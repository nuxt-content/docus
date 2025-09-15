<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const route = useRoute()
const docsNavigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const docsLink = computed(() => docsNavigation?.value.flatMap(item => item.children || [item]) || [])
const isDocs = computed(() => docsLink.value.findIndex(item => item.path === route.path) !== -1)
</script>

<template>
  <AppHeader />
  <UMain>
    <slot v-if="!isDocs" />
    <UContainer v-else>
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
</template>
