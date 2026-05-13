import type { UIMessage } from 'ai'
import { useAppConfig, useRuntimeConfig } from '#imports'
import { createSharedComposable, useLocalStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
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

export const useAssistant = createSharedComposable(() => {
  const config = useRuntimeConfig()
  const appConfig = useAppConfig()
  const assistantRuntimeConfig = config.public.assistant as { enabled?: boolean } | undefined
  const assistantConfig = appConfig.assistant as { faqQuestions?: FaqQuestions | LocalizedFaqQuestions } | undefined
  const docusRuntimeConfig = appConfig.docus as { locale?: string } | undefined
  const isEnabled = computed(() => assistantRuntimeConfig?.enabled ?? false)

  const storageOpen = useLocalStorage('assistant-open', false)
  const messages = useLocalStorage<UIMessage[]>('assistant-messages', [])

  const isOpen = ref(false)

  onNuxtReady(() => {
    nextTick(() => {
      isOpen.value = storageOpen.value
    })
  })

  watch(isOpen, (value) => {
    storageOpen.value = value
  })

  const faqQuestions = computed<FaqCategory[]>(() => {
    const faqConfig = assistantConfig?.faqQuestions
    if (!faqConfig) return []

    if (!Array.isArray(faqConfig)) {
      const localizedConfig = faqConfig as LocalizedFaqQuestions
      const currentLocale = docusRuntimeConfig?.locale || 'en'
      const defaultLocale = config.public.i18n?.defaultLocale || 'en'

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
      messages.value = [...messages.value, {
        id: String(Date.now()),
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: initialMessage }],
      }]
    }
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  return {
    isEnabled,
    isOpen,
    messages,
    faqQuestions,
    open,
    close,
    toggle,
  }
})
