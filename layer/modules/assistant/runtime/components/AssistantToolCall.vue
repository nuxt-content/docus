<script setup lang="ts">
import { motion } from 'motion-v'

const props = defineProps<{
  text: string
  isLoading?: boolean
  compact?: boolean
}>()

const dynamicSpread = computed(() => props.text.length * 2)
</script>

<template>
  <motion.div
    :initial="{ opacity: 0, y: 4 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.2 }"
    class="flex items-center rounded-lg bg-elevated/50 border border-default text-muted"
    :class="[
      compact ? 'gap-1.5 px-2 py-1 text-[10px]' : 'gap-2 px-2.5 py-1.5 text-xs',
    ]"
  >
    <UIcon
      :name="isLoading ? 'i-lucide-loader-circle' : 'i-lucide-file-text'"
      :class="[isLoading && 'animate-spin']"
      class="shrink-0 text-muted"
      :style="{ width: compact ? '12px' : '16px', height: compact ? '12px' : '16px' }"
    />
    <span
      class="truncate"
      :class="[
        isLoading && 'shimmer-text',
      ]"
      :style="isLoading ? {
        '--spread': `${dynamicSpread}px`,
        'backgroundImage': 'var(--bg), linear-gradient(var(--color-neutral-600), var(--color-neutral-600))',
      } : undefined"
    >
      {{ text }}
    </span>
  </motion.div>
</template>

<style scoped>
.shimmer-text {
  --bg: linear-gradient(90deg, #0000 calc(50% - var(--spread)), var(--color-neutral-100), #0000 calc(50% + var(--spread)));
  background-size: 250% 100%, auto;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  background-repeat: no-repeat, padding-box;
  animation: shimmer 2s linear infinite;
}

@keyframes shimmer {
  from {
    background-position: 100% center;
  }
  to {
    background-position: 0% center;
  }
}
</style>
