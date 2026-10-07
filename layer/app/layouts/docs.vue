<script setup lang="ts">
const route = useRoute()

// Remount instead of hydrating markup rendered for a previous route
const asideKey = ref(route.path)
const isAsideHydrated = ref(false)
watch(() => route.path, (path) => {
  if (!isAsideHydrated.value) {
    asideKey.value = path
  }
})
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <template #left>
          <UPageAside>
            <DocsAsideLeftTop />
            <LazyDocsAsideLeftBody
              :key="asideKey"
              hydrate-on-media-query="(min-width: 64rem)"
              @hydrated="isAsideHydrated = true"
            />
          </UPageAside>
        </template>
        <slot />
      </UPage>
    </UContainer>
  </UMain>
</template>
