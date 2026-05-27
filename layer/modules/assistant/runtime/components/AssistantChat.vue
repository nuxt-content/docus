<script setup lang="ts">
import { useDocusI18n } from '../../../../app/composables/useDocusI18n'

const appConfig = useAppConfig()
const { toggle, isStudioExpanded } = useAssistant()
const { t } = useDocusI18n()

const tooltipText = computed(() => t('assistant.tooltip'))
const triggerIcon = computed(() => appConfig.assistant?.icons?.trigger || 'i-custom-ai')
</script>

<template>
  <UTooltip
    v-if="!isStudioExpanded"
    :text="tooltipText"
  >
    <UButton
      :icon="triggerIcon"
      color="neutral"
      variant="ghost"
      @click="toggle"
    />
  </UTooltip>
</template>
