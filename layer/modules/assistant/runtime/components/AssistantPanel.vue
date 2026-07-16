<script setup lang="ts">
import type { ToolUIPart, DynamicToolUIPart } from 'ai'
import { DefaultChatTransport, isToolUIPart, isReasoningUIPart, isTextUIPart } from 'ai'
import { Chat } from '@ai-sdk/vue'
import { isPartStreaming, isToolStreaming } from '@nuxt/ui/utils/ai'
import { useDocusI18n } from '../../../../app/composables/useDocusI18n'
import { getToolText, getToolSuffix, getToolIcon } from '../../../../app/utils/assistantTools'
import AssistantComark from './AssistantComark'
import AssistantIndicator from './AssistantIndicator.vue'

const { isOpen, isStudioExpanded, messages, faqQuestions } = useAssistant()
const config = useRuntimeConfig()
const toast = useToast()
const { t } = useDocusI18n()
const input = ref('')

const open = computed({
  get: () => isOpen.value && !isStudioExpanded.value,
  set: (value) => {
    if (!isStudioExpanded.value) {
      isOpen.value = value
    }
  },
})

const promptRef = ref<{ textareaRef?: HTMLTextAreaElement } | null>(null)
watch(open, (value) => {
  if (!value) return
  nextTick(() => promptRef.value?.textareaRef?.focus({ preventScroll: true }))
})

const displayTitle = computed(() => t('assistant.title'))
const displayPlaceholder = computed(() => t('assistant.placeholder'))

let _skipSync = false

const chat = new Chat({
  messages: messages.value,
  transport: new DefaultChatTransport({
    api: (config.app?.baseURL.replace(/\/$/, '') || '') + config.public.assistant.apiPath,
  }),
  onError: (error: Error) => {
    let message = error.message
    if (typeof message === 'string' && message[0] === '{') {
      try {
        message = JSON.parse(message).message || message
      }
      catch {
        // keep original on malformed JSON
      }
    }

    toast.add({
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
      duration: 0,
    })
  },
  onFinish: () => {
    _skipSync = true
    messages.value = [...chat.messages]
    nextTick(() => {
      _skipSync = false
    })
  },
})

watch(messages, (newMessages) => {
  if (_skipSync) return

  chat.messages = newMessages
  if (chat.lastMessage?.role === 'user' && chat.status !== 'streaming') {
    chat.regenerate()
  }
})

const canClear = computed(() => messages.value.length > 0)

type ToolPart = ToolUIPart | DynamicToolUIPart

function getToolOutput(part: ToolPart): string | undefined {
  if (part.state !== 'output-available' || !part.output) return undefined

  const output = part.output as Record<string, unknown>
  const content = (output.content ?? output) as Array<{ text?: string }> | string

  if (typeof content === 'string') {
    return content || undefined
  }

  if (Array.isArray(content)) {
    return content.map(c => c.text).filter(Boolean).join('\n') || undefined
  }

  return JSON.stringify(output, null, 2)
}

function onSubmit() {
  if (!input.value.trim()) return

  chat.sendMessage({ text: input.value })
  input.value = ''
}

function askQuestion(question: string) {
  input.value = question
  onSubmit()
}

function clearMessages() {
  if (chat.status === 'streaming') {
    chat.stop()
  }
  messages.value = []
  chat.messages = []
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
          aria-label="Close"
          @click="() => { open = false }"
        />
      </UTooltip>
    </template>

    <UTheme
      :ui="{
        prose: {
          p: { base: 'my-2 text-sm/6' },
          li: { base: 'my-0.5 text-sm/6' },
          ul: { base: 'my-2' },
          ol: { base: 'my-2' },
          h1: { base: 'text-xl mb-4' },
          h2: { base: 'text-lg mt-6 mb-3' },
          h3: { base: 'text-base mt-4 mb-2' },
          h4: { base: 'text-sm mt-3 mb-1.5' },
          code: { base: 'text-xs' },
          pre: { root: 'my-2', base: 'text-xs/5' },
          table: { root: 'my-2' },
          hr: { base: 'my-4' },
        },
      }"
    >
      <UChatMessages
        v-if="chat.messages.length"
        should-auto-scroll
        :messages="chat.messages"
        :status="chat.status"
        compact
        class="px-0 gap-2"
        :user="{ ui: { container: 'max-w-full pb-3' } }"
      >
        <template #indicator>
          <AssistantIndicator />
        </template>

        <template #content="{ message }">
          <template
            v-for="(part, index) in message.parts"
            :key="`${message.id}-${part.type}-${index}`"
          >
            <UChatReasoning
              v-if="isReasoningUIPart(part)"
              :text="part.text"
              :streaming="isPartStreaming(part)"
              icon="i-lucide-brain"
              chevron="leading"
            >
              <AssistantComark
                :markdown="part.text"
                :streaming="isPartStreaming(part)"
              />
            </UChatReasoning>

            <template v-else-if="isTextUIPart(part) && part.text.length > 0">
              <AssistantComark
                v-if="message.role === 'assistant'"
                :markdown="part.text"
                :streaming="isPartStreaming(part)"
              />
              <p
                v-else-if="message.role === 'user'"
                class="whitespace-pre-wrap text-sm/6"
              >
                {{ part.text }}
              </p>
            </template>

            <UChatTool
              v-else-if="isToolUIPart(part)"
              :text="getToolText(part, t)"
              :suffix="getToolSuffix(part)"
              :icon="getToolIcon(part)"
              :streaming="isToolStreaming(part)"
              chevron="leading"
            >
              <pre
                v-if="getToolOutput(part)"
                class="text-xs text-muted whitespace-pre-wrap break-all rounded-md border border-muted bg-muted p-2 max-h-64 overflow-y-auto"
                v-text="getToolOutput(part)"
              />
            </UChatTool>
          </template>
        </template>
      </UChatMessages>

      <div v-else>
        <div
          v-if="!faqQuestions?.length"
          class="flex h-full flex-col items-center justify-center py-12 text-center"
        >
          <div class="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <UIcon
              name="i-lucide-message-circle-question"
              class="size-6 text-primary"
            />
          </div>
          <h3 class="mb-2 text-base font-medium text-highlighted">
            {{ t('assistant.askMeAnything') }}
          </h3>
          <p class="max-w-xs text-sm text-muted">
            {{ t('assistant.askMeAnythingDescription') }}
          </p>
        </div>

        <template v-else>
          <div class="flex flex-col gap-6">
            <UPageLinks
              v-for="category in faqQuestions"
              :key="category.category"
              :title="category.category"
              :links="category.items.map(item => ({ label: item, onClick: () => askQuestion(item) }))"
            />
          </div>
        </template>
      </div>
    </UTheme>

    <template #footer>
      <UChatPrompt
        ref="promptRef"
        v-model="input"
        :error="chat.error"
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
            :status="chat.status"
            :disabled="chat.status === 'ready' && !input.trim()"
            @stop="chat.stop()"
            @reload="chat.regenerate()"
          />
        </template>
      </UChatPrompt>
    </template>
  </USidebar>
</template>
