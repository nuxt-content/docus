<script setup lang="ts">
const route = useRoute()

const pageUrl = route.path
const appConfig = useAppConfig()
const { t } = useDocusI18n()
const { isEnabled, open } = useAIChat()

const showExplainWithAi = computed(() => {
  return isEnabled.value && appConfig.aiChat?.explainWithAi !== false
})
</script>

<template>
  <div
    v-if="appConfig.toc?.bottom?.links?.length || showExplainWithAi"
    class="hidden lg:block space-y-6"
  >
    <USeparator type="dashed" />

    <UPageLinks
      v-if="appConfig.toc?.bottom?.links?.length"
      :title="appConfig.toc?.bottom?.title || t('docs.links')"
      :links="appConfig.toc?.bottom?.links"
    />

    <USeparator
      v-if="appConfig.toc?.bottom?.links?.length && showExplainWithAi"
      type="dashed"
    />

    <UButton
      v-if="showExplainWithAi"
      icon="i-lucide-brain"
      label="Explain with AI"
      size="sm"
      variant="link"
      class="p-0 text-sm"
      color="neutral"
      @click="open(`Explain the page ${pageUrl}`, true)"
    />
  </div>
</template>
