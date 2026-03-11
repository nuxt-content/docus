import { useNuxtApp, useRuntimeConfig } from '#imports'
import type { LocaleObject } from '@nuxtjs/i18n'
import type { Ref } from 'vue'
import { ref } from 'vue'

type DocusNuxtApp = ReturnType<typeof useNuxtApp> & {
  $i18n?: {
    locale: Ref<string>
    t: (key: string) => string
  }
  $locale?: string
  $localeMessages?: Record<string, unknown>
  $localePath?: (path: string) => string
  $switchLocalePath?: (locale?: string) => string
}

export const useDocusI18n = () => {
  const config = useRuntimeConfig().public
  const nuxtApp = useNuxtApp() as DocusNuxtApp
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

  const locale = nuxtApp.$i18n?.locale || ref('en')
  const t = nuxtApp.$i18n?.t || ((key: string) => key)
  const filteredLocales = (config.docus as { filteredLocales: LocaleObject<string>[] })?.filteredLocales || []

  return {
    isEnabled,
    locale,
    locales: filteredLocales,
    t,
    localePath: nuxtApp.$localePath || ((path: string) => path),
    switchLocalePath: nuxtApp.$switchLocalePath || (() => ''),
  }
}
