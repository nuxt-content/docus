import { useI18n, useLocalePath, useNuxtApp, useRuntimeConfig, useSwitchLocalePath } from '#imports'
import type { LocaleObject } from '@nuxtjs/i18n'
import { ref } from 'vue'

export const useDocusI18n = () => {
  const config = useRuntimeConfig().public
  const nuxtApp = useNuxtApp()
  const isEnabled = ref(!!config.i18n)

  if (!isEnabled.value) {
    const locale = nuxtApp.$locale || 'en'
    const localeMessages = nuxtApp.$localeMessages || {}

    return {
      isEnabled,
      locale: ref(locale),
      locales: [],
      localePath: (path: string) => path,
      switchLocalePath: () => {},
      t: (key: string): string => {
        const path = key.split('.')
        return path.reduce((acc: unknown, curr) => (acc as Record<string, unknown>)?.[curr], localeMessages) as string
      },
    }
  }

  const { locale, t } = useI18n()
  const filteredLocales: LocaleObject<string>[] = config.docus?.filteredLocales || []

  return {
    isEnabled,
    locale,
    locales: filteredLocales,
    t,
    localePath: useLocalePath(),
    switchLocalePath: useSwitchLocalePath(),
  }
}
