<script setup lang="ts">
import { useDocusI18n } from '../../../../app/composables/useDocusI18n'

const AssistantPanelMessages = defineAsyncComponent(() => import('./AssistantPanelMessages.vue'))
const AssistantPanelPrompt = defineAsyncComponent(() => import('./AssistantPanelPrompt.vue'))

const { isOpen, isStudioExpanded, messages } = useAssistant()
const { t } = useDocusI18n()
const storedMessages = messages.value

const open = computed({
  get: () => isOpen.value && !isStudioExpanded.value,
  set: (value) => {
    if (!isStudioExpanded.value) {
      isOpen.value = value
    }
  },
})

const hasOpened = ref(open.value)
watch(open, (value) => {
  if (value) hasOpened.value = true
})

const displayTitle = computed(() => t('assistant.title'))

const canClear = computed(() => messages.value.length > 0)

function clearMessages() {
  messages.value = []
}

defineShortcuts({
  meta_i: {
    handler: () => {
      open.value = !open.value
    },
    usingInput: true,
  },
})
</script>

<template>
  <USidebar
    v-model:open="open"
    side="right"
    :title="displayTitle"
    rail
    :style="{ '--sidebar-width': '24rem' }"
    :ui="{ footer: 'p-0', actions: 'gap-0.5', container: '!left-auto' }"
  >
    <template #actions>
      <UTooltip
        v-if="canClear"
        :text="t('assistant.clearChat')"
      >
        <UButton
          icon="i-lucide-list-x"
          color="neutral"
          variant="ghost"
          :aria-label="t('assistant.clearChat')"
          @click="clearMessages"
        />
      </UTooltip>
    </template>

    <template #close>
      <UTooltip
        :text="t('assistant.close')"
        :kbds="['meta', 'i']"
      >
        <UButton
          icon="i-lucide-panel-right-close"
          color="neutral"
          variant="ghost"
          :aria-label="t('assistant.close')"
          @click="() => { open = false }"
        />
      </UTooltip>
    </template>

    <AssistantPanelMessages
      v-if="hasOpened"
      :stored-messages="storedMessages"
    />

    <template #footer>
      <AssistantPanelPrompt
        v-if="hasOpened"
        :stored-messages="storedMessages"
      />
    </template>
  </USidebar>
</template>
