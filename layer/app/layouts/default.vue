<script setup lang="ts">
const { locale, isEnabled } = useDocusI18n()
const route = useRoute()
const isLanding = computed(() => isEnabled.value ? route.path === `/${locale.value}` : route.path === '/')
</script>

<template>
  <AppHeader />
  <UMain>
    <slot v-if="isLanding" />
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
