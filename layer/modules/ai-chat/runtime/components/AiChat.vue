<script setup lang="ts">
import { useDocusI18n } from '../../../../app/composables/useDocusI18n'

const appConfig = useAppConfig()
const { toggle } = useAIChat()
const { t } = useDocusI18n()

const tooltipText = computed(() => t('aiChat.tooltip'))
const triggerIcon = computed(() => appConfig.aiChat?.icons?.trigger || 'i-lucide-sparkles')
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
