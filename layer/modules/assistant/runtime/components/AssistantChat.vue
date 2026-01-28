<script setup lang="ts">
import { useDocusI18n } from '../../../../app/composables/useDocusI18n'

const appConfig = useAppConfig()
const { toggle } = useAssistant()
const { t } = useDocusI18n()

const tooltipText = computed(() => t('assistant.tooltip'))
const triggerIcon = computed(() => appConfig.assistant?.icons?.trigger || 'i-lucide-sparkles')
</script>

<template>
  <UTooltip :text="tooltipText">
    <UButton
      :icon="triggerIcon"
      variant="ghost"
      class="rounded-full"
      @click="toggle"
    />
  </UTooltip>
</template>
