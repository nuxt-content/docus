<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { UIMessage } from 'ai'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import { useDocusI18n } from '../../../../app/composables/useDocusI18n'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components: Record<string, any> = {
  pre: defineAsyncComponent(() => import('./AssistantPreStream.vue')),
}

const { isOpen, isExpanded, toggleExpanded, messages, pendingMessage, clearPending, faqQuestions } = useAssistant()
const config = useRuntimeConfig()
const toast = useToast()
const { t } = useDocusI18n()
const input = ref('')

const displayTitle = computed(() => t('assistant.title'))
const displayPlaceholder = computed(() => t('assistant.placeholder'))

const chat = new Chat({
  messages: messages.value,
  transport: new DefaultChatTransport({
    api: config.public.assistant.apiPath,
  }),
  onError: (error: Error) => {
    const message = (() => {
      try {
        const parsed = JSON.parse(error.message)
        return parsed?.message || error.message
      }
      catch {
        return error.message
      }
    })()

    toast.add({
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
      duration: 0,
    })
  },
  onFinish: () => {
    messages.value = chat.messages
  },
})

watch(pendingMessage, (message: string | undefined) => {
  if (message) {
    if (messages.value.length === 0 && chat.messages.length > 0) {
      chat.messages.length = 0
    }
    chat.sendMessage({
      text: message,
    })
    clearPending()
  }
}, { immediate: true })

watch(messages, (newMessages: UIMessage[]) => {
  if (newMessages.length === 0 && chat.messages.length > 0) {
    chat.messages.length = 0
  }
}, { deep: true })

const lastMessage = computed(() => chat.messages.at(-1))
const showThinking = computed(() =>
  chat.status === 'streaming'
  && lastMessage.value?.role === 'assistant'
  && !lastMessage.value?.parts?.some((p: { type: string }) => p.type === 'text'),
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMessageToolCalls(message: any) {
  if (!message?.parts) return []
  return message.parts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => p.type === 'data-tool-calls')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .flatMap((p: any) => p.data?.tools || [])
}

function handleSubmit(event?: Event) {
  event?.preventDefault()

  if (!input.value.trim()) {
    return
  }

  chat.sendMessage({
    text: input.value,
  })

  input.value = ''
}

function askQuestion(question: string) {
  chat.sendMessage({
    text: question,
  })
}

function resetChat() {
  chat.stop()
  messages.value = []
  chat.messages.length = 0
}

onMounted(() => {
  if (pendingMessage.value) {
    chat.sendMessage({
      text: pendingMessage.value,
    })
    clearPending()
  }
  else if (chat.lastMessage?.role === 'user') {
    chat.regenerate()
  }
})
</script>

<template>
  <USidebar
    v-model:open="isOpen"
    side="right"
    collapsible="offcanvas"
    close
    :title="displayTitle"
    :style="{ '--sidebar-width': isExpanded ? '520px' : '360px' }"
  >
    <template #actions>
      <UTooltip :text="isExpanded ? t('assistant.collapse') : t('assistant.expand')">
        <UButton
          :icon="isExpanded ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
          color="neutral"
          variant="ghost"
          size="sm"
          class="text-muted hover:text-highlighted"
          @click="toggleExpanded"
        />
      </UTooltip>
      <UTooltip
        v-if="chat.messages.length > 0"
        :text="t('assistant.clearChat')"
      >
        <UButton
          icon="i-lucide-trash-2"
          color="neutral"
          variant="ghost"
          size="sm"
          class="text-muted hover:text-highlighted"
          @click="resetChat"
        />
      </UTooltip>
    </template>

    <template #body>
      <UChatMessages
        v-if="chat.messages.length > 0"
        :messages="chat.messages"
        compact
        :status="chat.status"
        :user="{ ui: { content: 'text-sm' } }"
        :ui="{ indicator: '*:bg-accented', root: 'h-auto!' }"
      >
        <template #content="{ message }">
          <div class="flex flex-col gap-2">
            <AssistantLoading
              v-if="message.role === 'assistant' && (getMessageToolCalls(message).length > 0 || (showThinking && message.id === lastMessage?.id))"
              :tool-calls="getMessageToolCalls(message)"
              :is-loading="showThinking && message.id === lastMessage?.id"
            />
            <template
              v-for="(part, index) in message.parts"
              :key="`${message.id}-${part.type}-${index}${'state' in part ? `-${part.state}` : ''}`"
            >
              <MDCCached
                v-if="part.type === 'text' && part.text"
                :value="part.text"
                :cache-key="`${message.id}-${index}`"
                :components="components"
                :parser-options="{ highlight: false }"
                class="*:first:mt-0 *:last:mb-0"
              />
            </template>
          </div>
        </template>
      </UChatMessages>

      <div
        v-else
      >
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
          <p class="mb-4 text-sm font-medium text-muted">
            {{ t('assistant.faq') }}
          </p>

          <div class="flex flex-col gap-5">
            <div
              v-for="category in faqQuestions"
              :key="category.category"
              class="flex flex-col gap-1.5"
            >
              <h4 class="text-xs font-medium uppercase tracking-wide text-dimmed">
                {{ category.category }}
              </h4>
              <div class="flex flex-col">
                <button
                  v-for="question in category.items"
                  :key="question"
                  class="py-1.5 text-left text-sm text-muted transition-colors hover:text-highlighted"
                  @click="askQuestion(question)"
                >
                  {{ question }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="w-full">
        <UChatPrompt
          v-model="input"
          :rows="2"
          :placeholder="displayPlaceholder"
          maxlength="1000"
          :ui="{
            root: 'shadow-none!',
            body: '*:p-0! *:rounded-none! *:text-base!',
          }"
          @submit="handleSubmit"
        >
          <template #footer>
            <div class="flex items-center gap-1 text-xs text-muted">
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
              class="ml-auto"
              size="xs"
              :status="chat.status"
              @stop="chat.stop()"
              @reload="chat.regenerate()"
            />
          </template>
        </UChatPrompt>
        <div class="mt-1 flex text-xs text-dimmed items-center justify-between">
          <span>{{ t('assistant.chatCleared') }}</span>
          <span>
            {{ input.length }}/1000
          </span>
        </div>
      </div>
    </template>
  </USidebar>
</template>
