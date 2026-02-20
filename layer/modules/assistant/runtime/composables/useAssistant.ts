import type { UIMessage } from 'ai'
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

export function useAssistant() {
  const config = useRuntimeConfig()
  const appConfig = useAppConfig()
  const isEnabled = computed(() => config.public.assistant?.enabled ?? false)

  const isOpen = useState('assistant-open', () => false)
  const isExpanded = useState('assistant-expanded', () => false)
  const messages = useState<UIMessage[]>('assistant-messages', () => [])
  const pendingMessage = useState<string | undefined>('assistant-pending', () => undefined)

  const faqQuestions = computed<FaqCategory[]>(() => {
    const assistantConfig = appConfig.assistant
    const faqConfig = assistantConfig?.faqQuestions
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
