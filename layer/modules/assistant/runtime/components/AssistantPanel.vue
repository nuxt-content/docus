<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { UIMessage } from 'ai'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import { createReusableTemplate } from '@vueuse/core'
import { useDocusI18n } from '../../../../app/composables/useDocusI18n'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components: Record<string, any> = {
  pre: defineAsyncComponent(() => import('./AssistantPreStream.vue')),
}

const [DefineChatContent, ReuseChatContent] = createReusableTemplate<{ showExpandButton?: boolean }>()

const { isOpen, isExpanded, isMobile, panelWidth, toggleExpanded, messages, pendingMessage, clearPending, faqQuestions } = useAssistant()
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
  <DefineChatContent v-slot="{ showExpandButton = true }">
    <div class="flex h-full flex-col">
      <div class="flex h-16 shrink-0 items-center justify-between border-b border-default px-4">
        <span class="font-medium text-highlighted">{{ displayTitle }}</span>
        <div class="flex items-center gap-1">
          <UTooltip
            v-if="showExpandButton"
            :text="isExpanded ? t('assistant.collapse') : t('assistant.expand')"
          >
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
          <UTooltip :text="t('assistant.close')">
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              class="text-muted hover:text-highlighted"
              @click="isOpen = false"
            />
          </UTooltip>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <UChatMessages
          v-if="chat.messages.length > 0"
          :messages="chat.messages"
          compact
          :status="chat.status"
          :user="{ ui: { content: 'text-sm' } }"
          :ui="{ indicator: '*:bg-accented', root: 'h-auto!' }"
          class="px-4 py-4"
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
          class="p-4"
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
      </div>

      <div class="w-full shrink-0 p-3">
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
    </div>
  </DefineChatContent>

  <aside
    v-if="!isMobile"
    class="left-auto! fixed top-0 z-50 h-dvh overflow-hidden border-l border-default bg-default/95 backdrop-blur-xl transition-[right,width] duration-200 ease-linear will-change-[right,width]"
    :style="{
      width: `${panelWidth}px`,
      right: isOpen ? '0' : `-${panelWidth}px`,
    }"
  >
    <div
      class="h-full transition-[width] duration-200 ease-linear"
      :style="{ width: `${panelWidth}px` }"
    >
      <ReuseChatContent :show-expand-button="true" />
    </div>
  </aside>

  <USlideover
    v-else
    v-model:open="isOpen"
    side="right"
    :ui="{
      content: 'ring-0 bg-default',
    }"
  >
    <template #content>
      <ReuseChatContent :show-expand-button="false" />
    </template>
  </USlideover>
</template>
