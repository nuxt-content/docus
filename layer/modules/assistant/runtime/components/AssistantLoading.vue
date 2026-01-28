<script setup lang="ts">
import { motion } from 'motion-v'
import { useDocusI18n } from '../../../../app/composables/useDocusI18n'

interface ToolCall {
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
}

const props = defineProps<{
  text?: string
  toolCalls?: ToolCall[]
  isLoading?: boolean
}>()

const { t } = useDocusI18n()

const messages = computed(() => [
  t('assistant.loading.searching'),
  t('assistant.loading.reading'),
  t('assistant.loading.analyzing'),
  t('assistant.loading.finding'),
])

const finishedMessage = computed(() => t('assistant.loading.finished'))

const currentIndex = ref(0)
const targetText = computed(() => {
  if (!props.isLoading) {
    return finishedMessage.value
  }
  return props.text || messages.value[currentIndex.value]
})
const displayedText = ref(targetText.value)

const chars = 'abcdefghijklmnopqrstuvwxyz'

function scrambleText(from: string, to: string) {
  const maxLength = Math.max(from.length, to.length)
  let frame = 0
  const totalFrames = 15

  const animate = () => {
    frame++
    let result = ''

    for (let i = 0; i < maxLength; i++) {
      const progress = frame / totalFrames
      const charProgress = progress * maxLength

      if (i < charProgress - 2) {
        result += to[i] || ''
      }
      else if (i < charProgress) {
        result += chars[Math.floor(Math.random() * chars.length)]
      }
      else {
        result += from[i] || ''
      }
    }

    displayedText.value = result

    if (frame < totalFrames) {
      requestAnimationFrame(animate)
    }
    else {
      displayedText.value = to
    }
  }

  requestAnimationFrame(animate)
}

let textInterval: ReturnType<typeof setInterval> | null = null

watch(targetText, (newText, oldText) => {
  if (newText !== oldText && newText && oldText) {
    scrambleText(oldText, newText)
  }
})

// Stop text rotation when loading finishes
watch(() => props.isLoading, (isLoading) => {
  if (!isLoading && textInterval) {
    clearInterval(textInterval)
    textInterval = null
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getToolLabel(toolName: string, args: any) {
  const path = args?.path || ''

  if (toolName === 'list-pages') {
    return t('assistant.toolListPages')
  }

  if (toolName === 'get-page') {
    return `${t('assistant.toolReadPage')} ${path || '...'}`
  }

  return toolName
}

onMounted(() => {
  // Text rotation only when loading
  if (!props.text && props.isLoading) {
    textInterval = setInterval(() => {
      currentIndex.value = (currentIndex.value + 1) % messages.value.length
    }, 3500)
  }
})

onUnmounted(() => {
  if (textInterval) clearInterval(textInterval)
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Main loader with matrix and text -->
    <div class="flex items-center text-xs text-muted overflow-hidden">
      <motion.div
        v-if="isLoading"
        :initial="{ opacity: 1, width: 'auto' }"
        :exit="{ opacity: 0, width: 0 }"
        :transition="{ duration: 0.2 }"
        class="shrink-0 mr-2"
      >
        <AssistantMatrix />
      </motion.div>
      <motion.span
        :animate="{ x: 0 }"
        :transition="{ duration: 0.2 }"
        class="font-mono tracking-tight"
      >
        {{ displayedText }}
      </motion.span>
    </div>

    <!-- Tool calls displayed below -->
    <div
      v-if="toolCalls?.length"
      class="flex flex-col gap-1"
      :class="isLoading ? 'pl-[22px]' : 'pl-0'"
    >
      <motion.div
        v-for="tool in toolCalls"
        :key="`${tool.toolCallId}-${JSON.stringify(tool.args)}`"
        :initial="{ opacity: 0, x: -4 }"
        :animate="{ opacity: 1, x: 0 }"
        :transition="{ duration: 0.15 }"
        class="flex items-center gap-1.5"
      >
        <span class="size-1 rounded-full bg-current opacity-40" />
        <span class="text-[11px] text-dimmed truncate max-w-[200px]">
          {{ getToolLabel(tool.toolName, tool.args) }}
        </span>
      </motion.div>
    </div>
  </div>
</template>
