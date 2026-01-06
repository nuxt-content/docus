<script setup lang="ts">
import type { DefineComponent } from 'vue'
import type { UIMessage } from 'ai'
import type { FaqCategory } from '~/types'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import AiChatPreStream from './AiChatPreStream.vue'
import { useDocusI18n } from '../../../../app/composables/useDocusI18n'

const props = defineProps<{
  faqQuestions?: FaqCategory[]
}>()

const components = {
  pre: AiChatPreStream as unknown as DefineComponent,
}

const { isOpen, messages, pendingMessage, clearPending } = useAIChat()
const config = useRuntimeConfig()
const appConfig = useAppConfig()
const toast = useToast()
const { t } = useDocusI18n()

const input = ref('')

const triggerIcon = computed(() => appConfig.aiChat?.icons?.trigger || 'i-lucide-sparkles')
const displayTitle = computed(() => t('aiChat.title'))
const displayPlaceholder = computed(() => t('aiChat.placeholder'))

const chat = new Chat({
  messages: messages.value,
  transport: new DefaultChatTransport({
    api: config.public.aiChat.apiPath,
  }),
  onError: (error: Error) => {
    const { message } = typeof error.message === 'string' && error.message[0] === '{' ? JSON.parse(error.message) : error

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
  && lastMessage.value?.parts?.length === 0,
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getToolLabel(toolName: string, args: any) {
  const path = args?.path || ''

  if (toolName === 'list-pages') {
    return t('aiChat.toolListPages')
  }

  if (toolName === 'get-page') {
    return `${t('aiChat.toolReadPage')} ${path || '...'}`
  }

  return toolName
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
  <USlideover
    v-model:open="isOpen"
    side="right"
    :ui="{
      overlay: 'bg-default/60 backdrop-blur-sm',
      content: 'w-full sm:max-w-md bg-default/95 backdrop-blur-xl shadow-2xl',
      header: 'px-3! py-2! border-b border-muted/50',
      body: 'p-0!',
      footer: 'p-0!',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <div class="size-6 rounded-full bg-primary/10 flex items-center justify-center">
            <UIcon
              :name="triggerIcon"
              class="size-3.5 text-primary"
            />
          </div>
          <span class="font-medium text-highlighted">{{ displayTitle }}</span>
        </div>
        <div class="flex items-center gap-1">
          <UTooltip
            v-if="chat.messages.length > 0"
            :text="t('aiChat.clearChat')"
          >
            <UButton
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="xs"
              class="text-muted hover:text-highlighted"
              @click="resetChat"
            />
          </UTooltip>
          <UTooltip :text="t('aiChat.close')">
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              class="text-muted hover:text-highlighted"
              @click="isOpen = false"
            />
          </UTooltip>
        </div>
      </div>
    </template>

    <template #body>
      <UChatMessages
        v-if="chat.messages.length > 0"
        should-auto-scroll
        :messages="chat.messages"
        compact
        :status="chat.status"
        :user="{ ui: { content: 'text-sm' } }"
        :ui="{ indicator: '*:bg-accented' }"
        class="flex-1 px-4 py-4"
      >
        <template #content="{ message }">
          <div class="flex flex-col gap-2">
            <div v-if="showThinking && message.role === 'assistant'">
              <AiTextShimmer :text="t('aiChat.thinking')" />
            </div>
            <template
              v-for="(part, index) in message.parts"
              :key="`${message.id}-${part.type}-${index}${'state' in part ? `-${part.state}` : ''}`"
            >
              <MDCCached
                v-if="part.type === 'text'"
                :value="part.text"
                :cache-key="`${message.id}-${index}`"
                :components="components"
                :parser-options="{ highlight: false }"
                class="*:first:mt-0 *:last:mb-0"
              />

              <template v-else-if="part.type === 'data-tool-calls'">
                <AiChatToolCall
                  v-for="tool in (part as any).data.tools"
                  :key="`${tool.toolCallId}-${JSON.stringify(tool.args)}`"
                  :text="getToolLabel(tool.toolName, tool.args)"
                  :is-loading="false"
                />
              </template>
            </template>
          </div>
        </template>
      </UChatMessages>

      <div
        v-else
        class="flex-1 overflow-y-auto p-4"
      >
        <div
          v-if="!props.faqQuestions?.length"
          class="flex flex-col items-center justify-center h-full text-center py-12"
        >
          <div class="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UIcon
              name="i-lucide-message-circle-question"
              class="size-6 text-primary"
            />
          </div>
          <h3 class="text-base font-medium text-highlighted mb-2">
            {{ t('aiChat.askMeAnything') }}
          </h3>
          <p class="text-sm text-muted max-w-xs">
            {{ t('aiChat.askMeAnythingDescription') }}
          </p>
        </div>

        <template v-else>
          <p class="text-sm font-medium text-muted mb-4">
            {{ t('aiChat.faq') }}
          </p>

          <div class="flex flex-col gap-5">
            <div
              v-for="category in props.faqQuestions"
              :key="category.category"
              class="flex flex-col gap-1.5"
            >
              <h4 class="text-xs font-medium text-dimmed uppercase tracking-wide">
                {{ category.category }}
              </h4>
              <div class="flex flex-col">
                <button
                  v-for="question in category.items"
                  :key="question"
                  class="text-left text-sm text-muted hover:text-highlighted py-1.5 transition-colors"
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
      <div class="p-3 w-full">
        <UChatPrompt
          v-model="input"
          :rows="2"
          class="text-sm"
          :placeholder="displayPlaceholder"
          :ui="{
            body: '*:p-0! *:rounded-none!',
          }"
          @submit="handleSubmit"
        >
          <template #footer>
            <div class="flex items-center divide-x divide-muted/50">
              <span class="text-xs text-muted pr-2">{{ t('aiChat.chatCleared') }}</span>
              <div class="flex items-center gap-1 text-xs text-muted pl-2">
                <span>{{ t('aiChat.lineBreak') }}</span>
                <UKbd value="shift" />
                <UKbd value="enter" />
              </div>
            </div>
            <UChatPromptSubmit
              size="xs"
              :status="chat.status"
              @stop="chat.stop()"
              @reload="chat.regenerate()"
            />
          </template>
        </UChatPrompt>
      </div>
    </template>
  </USlideover>
</template>
