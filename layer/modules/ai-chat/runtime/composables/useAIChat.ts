import type { UIMessage } from 'ai'
import { useMediaQuery } from '@vueuse/core'
import type { FaqCategory, FaqQuestions, LocalizedFaqQuestions } from '../types'

function normalizeFaqQuestions(questions: FaqQuestions): FaqCategory[] {
  if (!questions || (Array.isArray(questions) && questions.length === 0)) {
    return []
  }

  if (typeof questions[0] === 'string') {
    return [{
      category: 'Questions',
      items: questions as string[],
    }]
  }

  return questions as FaqCategory[]
}

const PANEL_WIDTH_COMPACT = 360
const PANEL_WIDTH_EXPANDED = 520

export function useAIChat() {
  const config = useRuntimeConfig()
  const appConfig = useAppConfig()
  const isEnabled = computed(() => config.public.aiChat?.enabled ?? false)

  const isOpen = useState('ai-chat-open', () => false)
  const isExpanded = useState('ai-chat-expanded', () => false)
  const messages = useState<UIMessage[]>('ai-chat-messages', () => [])
  const pendingMessage = useState<string | undefined>('ai-chat-pending', () => undefined)

  const isMobile = useMediaQuery('(max-width: 767px)')
  const panelWidth = computed(() => isExpanded.value ? PANEL_WIDTH_EXPANDED : PANEL_WIDTH_COMPACT)
  const shouldPushContent = computed(() => !isMobile.value && isOpen.value)

  const faqQuestions = computed<FaqCategory[]>(() => {
    const aiChatConfig = appConfig.aiChat
    const faqConfig = aiChatConfig?.faqQuestions
    if (!faqConfig) return []

    // Check if it's a localized object (has locale keys like 'en', 'fr')
    if (!Array.isArray(faqConfig)) {
      const localizedConfig = faqConfig as LocalizedFaqQuestions
      const currentLocale = appConfig.docus?.locale || 'en'
      const defaultLocale = config.public.i18n?.defaultLocale || 'en'

      // Try current locale, then default locale, then first available
      const questions = localizedConfig[currentLocale]
        || localizedConfig[defaultLocale]
        || Object.values(localizedConfig)[0]

      return normalizeFaqQuestions(questions || [])
    }

    return normalizeFaqQuestions(faqConfig)
  })

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

  function toggleExpanded() {
    isExpanded.value = !isExpanded.value
  }

  return {
    isEnabled,
    isOpen,
    isExpanded,
    isMobile,
    panelWidth,
    shouldPushContent,
    messages,
    pendingMessage,
    faqQuestions,
    open,
    clearPending,
    close,
    toggle,
    toggleExpanded,
    clearMessages,
  }
}
