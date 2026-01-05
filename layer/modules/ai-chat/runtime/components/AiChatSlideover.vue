<script setup lang="ts">
import type { DefineComponent } from 'vue'
import type { UIMessage } from 'ai'
import type { FaqCategory } from '~/types'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import AiChatPreStream from './AiChatPreStream.vue'

const props = withDefaults(defineProps<{
  title?: string
  placeholder?: string
  faqQuestions?: FaqCategory[]
}>(), {
  title: 'Ask AI',
  placeholder: 'Ask a question...',
})

const components = {
  pre: AiChatPreStream as unknown as DefineComponent,
}

const { isOpen, messages, pendingMessage, clearPending } = useAIChat()
const config = useRuntimeConfig()

const input = ref('')

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

const toast = useToast()
const lastMessage = computed(() => chat.messages.at(-1))
const showThinking = computed(() =>
  chat.status === 'streaming'
  && lastMessage.value?.role === 'assistant'
  && lastMessage.value?.parts?.length === 0,
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getToolLabel(toolName: string, args: any) {
  const path = args?.path || ''

  const labels: Record<string, string> = {
    'list-pages': 'Listed documentation pages',
    'get-page': `Read ${path || 'page'}`,
  }

  return labels[toolName] || toolName
}

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
              name="i-lucide-sparkles"
              class="size-3.5 text-primary"
            />
          </div>
          <span class="font-medium text-highlighted">{{ props.title }}</span>
        </div>
        <div class="flex items-center gap-1">
          <UTooltip
            v-if="chat.messages.length > 0"
            text="Clear chat"
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
          <UTooltip text="Close">
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
              <AiTextShimmer text="Thinking..." />
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
                  :key="tool.toolCallId"
                  :text="getToolLabel(tool.toolName, tool.input)"
                  :is-loading="false"
                />
              </template>
            </template>
          </div>
        </template>
      </UChatMessages>

      <div
        v-else
        class="flex-1 overflow-y-auto px-4 py-4"
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
            Ask me anything
          </h3>
          <p class="text-sm text-muted max-w-xs">
            I can help you navigate the documentation, explain concepts, and answer your questions.
          </p>
        </div>

        <template v-else>
          <p class="text-sm font-medium text-muted mb-4">
            FAQ
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
      <div class="border-t border-muted/50 p-3 w-full">
        <div class="relative flex items-end gap-2 rounded-xl bg-elevated/70 pr-2 pb-2">
          <UTextarea
            v-model="input"
            :rows="1"
            autoresize
            variant="none"
            :placeholder="props.placeholder"
            class="flex-1 text-sm bg-transparent resize-none"
            :ui="{
              base: 'bg-transparent! ring-0! shadow-none!',
            }"
            @keydown.enter.exact.prevent="handleSubmit"
          />
          <UButton
            icon="i-lucide-arrow-up"
            color="primary"
            size="xs"
            :disabled="!input.trim() || chat.status === 'streaming'"
            :loading="chat.status === 'streaming'"
            class="shrink-0 rounded-lg"
            @click="handleSubmit"
          />
        </div>
        <div class="flex justify-between items-center mt-2 px-1 text-xs text-dimmed">
          <span>Chat is cleared on refresh</span>
          <div class="flex items-center gap-1">
            <span>Line break</span>
            <UKbd value="shift" />
            <UKbd value="enter" />
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>
