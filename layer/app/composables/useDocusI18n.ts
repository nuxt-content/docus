import type { LocaleObject } from '@nuxtjs/i18n'

export const useDocusI18n = () => {
  const config = useRuntimeConfig().public
  const isEnabled = ref(!!config.i18n)

  if (!isEnabled.value) {
    const locale = useNuxtApp().$locale as string
    const localeMessages = useNuxtApp().$localeMessages as Record<string, unknown>

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
  const filteredLocales = (config.docus as { filteredLocales: LocaleObject<string>[] })?.filteredLocales || []

  return {
    isEnabled,
    locale,
    locales: filteredLocales,
    t,
    localePath: useLocalePath(),
    switchLocalePath: useSwitchLocalePath(),
  }
}
