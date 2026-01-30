<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'

const config = useRuntimeConfig()
const { t, locale } = useDocusI18n()
const isEnabled = computed(() => config.public.assistant?.enabled ?? false)

const input = ref('')

const suggestedQuestionsMap: Record<string, string[]> = {
  en: [
    'How do I get started?',
    'What is Docus?',
    'How to customize the theme?',
  ],
  fr: [
    'Comment démarrer ?',
    'Qu\'est-ce que Docus ?',
    'Comment personnaliser le thème ?',
  ],
}

const suggestedQuestions = computed(() => suggestedQuestionsMap[locale.value] || suggestedQuestionsMap.en)

const chat = isEnabled.value
  ? new Chat({
      messages: [],
      transport: new DefaultChatTransport({
        api: config.public.assistant.apiPath,
      }),
      onError: (error: Error) => {
        console.error('AI Chat error:', error)
      },
    })
  : null

const lastMessage = computed(() => chat?.messages.at(-1))
const showThinking = computed(() =>
  chat?.status === 'streaming'
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

  if (!input.value.trim() || !chat) {
    return
  }

  chat.sendMessage({
    text: input.value,
  })

  input.value = ''
}

function askQuestion(question: string) {
  if (!chat) return
  chat.sendMessage({
    text: question,
  })
}

function resetChat() {
  if (!chat) return
  chat.stop()
  chat.messages.length = 0
}
</script>

<template>
  <div class="flex flex-col w-full h-96 rounded-lg overflow-hidden">
    <div class="flex-1 overflow-y-auto">
      <template v-if="isEnabled && chat">
        <div
          v-if="chat.messages.length === 0"
          class="h-full flex flex-col items-center justify-center p-4"
        >
          <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <UIcon
              name="i-lucide-sparkles"
              class="size-5 text-primary"
            />
          </div>
          <p class="text-sm text-muted mb-4">
            {{ t('assistant.tryAsking') }}
          </p>
          <div class="flex flex-wrap gap-2 justify-center">
            <button
              v-for="question in suggestedQuestions"
              :key="question"
              class="px-3 py-1.5 text-xs text-muted bg-elevated hover:bg-accented rounded-full transition-colors cursor-pointer"
              @click="askQuestion(question)"
            >
              {{ question }}
            </button>
          </div>
        </div>

        <UChatMessages
          v-else
          should-auto-scroll
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
                  :cache-key="`demo-${message.id}-${index}`"
                  :parser-options="{ highlight: false }"
                  class="*:first:mt-0 *:last:mb-0"
                />
              </template>
            </div>
          </template>
        </UChatMessages>
      </template>

      <div
        v-else
        class="h-full flex flex-col items-center justify-center p-4 text-center"
      >
        <div class="size-10 rounded-full bg-muted/10 flex items-center justify-center mb-3">
          <UIcon
            name="i-lucide-sparkles"
            class="size-5 text-muted"
          />
        </div>
        <p class="text-sm text-muted">
          Assistant not configured
        </p>
      </div>
    </div>

    <div class="p-3">
      <form
        class="flex items-center gap-2"
        @submit.prevent="handleSubmit"
      >
        <UInput
          v-model="input"
          :disabled="!isEnabled"
          :placeholder="t('assistant.askAnything')"
          size="sm"
          class="flex-1"
          :ui="{
            base: 'bg-elevated',
          }"
          @keydown.enter.exact.prevent="handleSubmit"
        />
        <div class="flex items-center gap-1">
          <UButton
            v-if="chat?.messages.length"
            icon="i-lucide-trash-2"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="!isEnabled"
            @click="resetChat"
          />
          <UButton
            type="submit"
            icon="i-lucide-arrow-up"
            color="primary"
            size="xs"
            :disabled="!isEnabled || !input.trim() || chat?.status === 'streaming'"
            :loading="chat?.status === 'streaming'"
          />
        </div>
      </form>
    </div>
  </div>
</template>
