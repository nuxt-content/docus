<script setup lang="ts">
import type { UIMessage } from 'ai'
import { useDocusI18n } from '../../../../app/composables/useDocusI18n'
import { useAssistantChat } from '../composables/useAssistantChat'

const props = defineProps<{
  storedMessages: UIMessage[]
}>()

const { isOpen, isStudioExpanded } = useAssistant()
const { t } = useDocusI18n()
const { input, status, error, regenerate, stop, onSubmit } = useAssistantChat(props.storedMessages)

const promptRef = ref<{ textareaRef?: HTMLTextAreaElement } | null>(null)
watch(() => isOpen.value && !isStudioExpanded.value, (value) => {
  if (!value) return
  nextTick(() => promptRef.value?.textareaRef?.focus({ preventScroll: true }))
})

const displayPlaceholder = computed(() => t('assistant.placeholder'))
</script>

<template>
  <UChatPrompt
    ref="promptRef"
    v-model="input"
    :error="error"
    :placeholder="displayPlaceholder"
    variant="naked"
    size="sm"
    autofocus
    :ui="{ base: 'px-0' }"
    class="px-4"
    @submit="onSubmit"
  >
    <template #footer>
      <div class="flex items-center gap-1.5 text-xs text-dimmed">
        <span>{{ t('assistant.lineBreak') }}</span>
        <UKbd
          size="sm"
          value="shift"
        />
        <UKbd
          size="sm"
          value="enter"
        />
      </div>

      <UChatPromptSubmit
        size="sm"
        :status="status"
        :disabled="status === 'ready' && !input.trim()"
        @stop="stop()"
        @reload="regenerate()"
      />
    </template>
  </UChatPrompt>
</template>
