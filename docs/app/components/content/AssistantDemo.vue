<script setup lang="ts">
import { useChat } from '@ai-sdk/vue'
import { DefaultChatTransport, isToolUIPart, isTextUIPart } from 'ai'
import { isToolStreaming } from '@nuxt/ui/utils/ai'

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

const {
  messages: chatMessages,
  status,
  sendMessage,
  stop,
  regenerate,
} = useChat({
  messages: [],
  transport: new DefaultChatTransport({
    api: config.public.assistant.apiPath,
  }),
  onError: (error: Error) => {
    console.error('AI Chat error:', error)
  },
})

function handleSubmit() {
  if (!input.value.trim() || !isEnabled.value) return

  sendMessage({ text: input.value })
  input.value = ''
}

function askQuestion(question: string) {
  if (!isEnabled.value) return
  sendMessage({
    text: question,
  })
}

function resetChat() {
  if (!isEnabled.value) return
  stop()
  chatMessages.value = []
}
</script>

<template>
  <div class="flex flex-col w-full h-96 rounded-lg overflow-hidden">
    <div class="flex-1 overflow-y-auto">
      <template v-if="isEnabled">
        <div
          v-if="chatMessages.length === 0"
          class="h-full flex flex-col items-center justify-center p-4"
        >
          <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <UIcon
              name="i-custom:ai"
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
          :messages="chatMessages"
          compact
          :status="status"
          :user="{ ui: { content: 'text-sm' } }"
          :ui="{ indicator: '*:bg-accented', root: 'h-auto!' }"
          class="px-4 py-4"
        >
          <template #indicator>
            <UChatTool
              icon="i-lucide-brain"
              :text="t('assistant.loading.thinking')"
              streaming
            />
          </template>

          <template #content="{ message }">
            <template
              v-for="(part, index) in message.parts"
              :key="`${message.id}-${part.type}-${index}`"
            >
              <AssistantComark
                v-if="isTextUIPart(part) && part.text"
                :markdown="part.text"
              />

              <UChatTool
                v-else-if="isToolUIPart(part)"
                :text="getToolText(part, t)"
                :suffix="getToolSuffix(part)"
                :icon="getToolIcon(part)"
                :streaming="isToolStreaming(part)"
              />
            </template>
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
      <UChatPrompt
        v-model="input"
        :disabled="!isEnabled"
        :placeholder="t('assistant.askAnything')"
        variant="subtle"
        :autofocus="false"
        size="sm"
        @submit="handleSubmit"
      >
        <template #footer>
          <div class="ml-auto flex items-center gap-2">
            <UButton
              v-if="chatMessages.length"
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="!isEnabled"
              @click="resetChat"
            />

            <UChatPromptSubmit
              size="xs"
              :status="status"
              :disabled="!isEnabled || (status === 'ready' && !input.trim())"
              @stop="stop()"
              @reload="regenerate()"
            />
          </div>
        </template>
      </UChatPrompt>
    </div>
  </div>
</template>
