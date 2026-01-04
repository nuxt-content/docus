<script setup lang="ts">
withDefaults(defineProps<{
  tooltipText?: string
}>(), {
  tooltipText: 'Ask AI a question',
})

const { toggle } = useAIChat()
</script>

<template>
  <UTooltip :text="tooltipText">
    <UButton
      icon="i-lucide-sparkles"
      variant="ghost"
      class="rounded-full"
      @click="toggle"
    />
  </UTooltip>
</template>
