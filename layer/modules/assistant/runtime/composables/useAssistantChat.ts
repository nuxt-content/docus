import type { UIMessage } from 'ai'
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/vue'
import { createSharedComposable } from '@vueuse/core'
import { nextTick, ref, watch } from 'vue'
import { useRuntimeConfig, useToast } from '#imports'
import { useAssistant } from './useAssistant'

export const useAssistantChat = createSharedComposable((storedMessages: UIMessage[]) => {
  const { messages } = useAssistant()
  const config = useRuntimeConfig()
  const toast = useToast()
  const input = ref('')

  let _skipSync = false

  const {
    messages: chatMessages,
    status,
    error,
    sendMessage,
    regenerate,
    stop,
  } = useChat({
    messages: storedMessages,
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
      messages.value = [...chatMessages.value]
      nextTick(() => {
        _skipSync = false
      })
    },
  })

  function syncMessages(newMessages: UIMessage[]) {
    if (_skipSync) return

    if (!newMessages.length && status.value === 'streaming') {
      stop()
    }

    chatMessages.value = newMessages
    const lastMessage = chatMessages.value[chatMessages.value.length - 1]
    if (lastMessage?.role === 'user' && status.value !== 'streaming') {
      regenerate()
    }
  }

  watch(messages, syncMessages, { immediate: messages.value !== storedMessages })

  function onSubmit() {
    if (!input.value.trim()) return

    sendMessage({ text: input.value })
    input.value = ''
  }

  function askQuestion(question: string) {
    input.value = question
    onSubmit()
  }

  return {
    input,
    chatMessages,
    status,
    error,
    regenerate,
    stop,
    onSubmit,
    askQuestion,
  }
})
