<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport, isToolUIPart, isTextUIPart, getToolName } from 'ai'
import { isToolStreaming } from '@nuxt/ui/utils/ai'
import AssistantComark from '../../../../layer/modules/assistant/runtime/components/AssistantComark'

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

function getToolText(part: Parameters<typeof getToolName>[0]) {
  const toolName = getToolName(part)
  const input = (part as { input?: Record<string, string> }).input
  const verb = part.state === 'output-available' ? 'Searched' : 'Searching'
  const readVerb = part.state === 'output-available' ? 'Read' : 'Reading'

  return {
    'list-pages': `${verb} pages`,
    'get-page': `${readVerb} ${input?.path || '...'}`,
  }[toolName] || `${verb} ${toolName}`
}

function handleSubmit() {
  if (!input.value.trim() || !chat) return

  chat.sendMessage({ text: input.value })
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
          :messages="chat.messages"
          compact
          :status="chat.status"
          :user="{ ui: { content: 'text-sm' } }"
          :ui="{ indicator: '*:bg-accented', root: 'h-auto!' }"
          class="px-4 py-4"
        >
          <template #indicator>
            <UChatTool
              icon="i-lucide-brain"
              text="Thinking..."
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
                :text="getToolText(part)"
                :icon="getToolName(part) === 'get-page' ? 'i-lucide-file-text' : 'i-lucide-search'"
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
        size="sm"
        @submit="handleSubmit"
      >
        <template #footer>
          <div class="ml-auto flex items-center gap-2">
            <UButton
              v-if="chat?.messages.length"
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="!isEnabled"
              @click="resetChat"
            />

            <UChatPromptSubmit
              size="xs"
              :status="chat?.status || 'ready'"
              :disabled="!isEnabled || (chat?.status === 'ready' && !input.trim())"
              @stop="chat?.stop()"
              @reload="chat?.regenerate()"
            />
          </div>
        </template>
      </UChatPrompt>
    </div>
  </div>
</template>
