<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'

const { open, isOpen } = useAIChat()
const input = ref('')
const isVisible = ref(true)
const inputRef = ref<{ inputRef: HTMLInputElement } | null>(null)

function handleSubmit() {
  if (!input.value.trim()) return

  const message = input.value
  isVisible.value = false

  setTimeout(() => {
    open(message, true)
    input.value = ''
    isVisible.value = true
  }, 200)
}

defineShortcuts({
  meta_i: {
    usingInput: true,
    handler: () => {
      inputRef.value?.inputRef?.focus()
    },
  },
  escape: {
    usingInput: true,
    handler: () => {
      inputRef.value?.inputRef?.blur()
    },
  },
})
</script>

<template>
  <AnimatePresence>
    <motion.div
      v-if="isVisible && !isOpen"
      key="floating-input"
      :initial="{ y: 20, opacity: 0 }"
      :animate="{ y: 0, opacity: 1 }"
      :exit="{ y: 100, opacity: 0 }"
      :transition="{ duration: 0.2, ease: 'easeOut' }"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4"
      style="will-change: transform"
    >
      <form @submit.prevent="handleSubmit">
        <UInput
          ref="inputRef"
          v-model="input"
          placeholder="Ask a question..."
          size="lg"
          :ui="{
            root: 'w-72 py-0.5 focus-within:w-96 transition-all duration-300 ease-out',
            base: 'bg-default/80 backdrop-blur-xl shadow-lg rounded-xl',
            trailing: 'pe-2',
          }"
          @keydown.enter.exact.prevent="handleSubmit"
        >
          <template #trailing>
            <div class="flex items-center gap-2">
              <div class="hidden sm:flex items-center gap-1">
                <UKbd value="meta" />
                <UKbd value="I" />
              </div>

              <UButton
                type="submit"
                icon="i-lucide-arrow-up"
                color="primary"
                size="xs"
                :disabled="!input.trim()"
              />
            </div>
          </template>
        </UInput>
      </form>
    </motion.div>
  </AnimatePresence>
</template>
