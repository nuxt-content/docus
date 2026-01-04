<script setup lang="ts">
const route = useRoute()

const pageUrl = route.path
const appConfig = useAppConfig()
const { t } = useDocusI18n()
const { open } = useAIChat()
</script>

<template>
  <div
    v-if="appConfig.toc?.bottom?.links?.length"
    class="hidden lg:block space-y-6"
  >
    <USeparator type="dashed" />

    <UPageLinks
      :title="appConfig.toc?.bottom?.title || t('docs.links')"
      :links="appConfig.toc?.bottom?.links"
    />

    <UButton
      icon="i-lucide-brain"
      target="_blank"
      label="Explain with AI"
      size="sm"
      variant="ghost"
      color="neutral"
      @click="open(`Explain the page ${pageUrl}`, true)"
    />
  </div>
</template>
