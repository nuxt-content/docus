<script setup lang="ts">
import { motion } from 'motion-v'

defineProps<{
  text: string
  isLoading?: boolean
}>()
</script>

<template>
  <motion.div
    :initial="{ opacity: 0, y: 4 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.2 }"
    class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-elevated/50 border border-default text-xs text-muted"
  >
    <UIcon
      :name="isLoading ? 'i-lucide-loader-circle' : 'i-lucide-file-text'"
      :class="[isLoading && 'animate-spin']"
      class="size-4 shrink-0 text-muted"
    />
    <span class="truncate">{{ text }}</span>
  </motion.div>
</template>
