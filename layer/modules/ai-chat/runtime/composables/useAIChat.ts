import type { UIMessage } from 'ai'

export function useAIChat() {
  const config = useRuntimeConfig()
  const isEnabled = computed(() => config.public.aiChat?.enabled ?? false)

  const isOpen = useState('ai-chat-open', () => false)
  const messages = useState<UIMessage[]>('ai-chat-messages', () => [])
  const pendingMessage = useState<string | undefined>('ai-chat-pending', () => undefined)

  function open(initialMessage?: string, clearPrevious = false) {
    if (clearPrevious) {
      messages.value = []
    }

    if (initialMessage) {
      pendingMessage.value = initialMessage
    }
    isOpen.value = true
  }

  function clearPending() {
    pendingMessage.value = undefined
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  function clearMessages() {
    messages.value = []
  }

  return {
    isEnabled,
    isOpen,
    messages,
    pendingMessage,
    open,
    clearPending,
    close,
    toggle,
    clearMessages,
  }
}
