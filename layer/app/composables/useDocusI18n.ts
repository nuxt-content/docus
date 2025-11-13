import type { LocaleObject } from '@nuxtjs/i18n'
import en from '../../i18n/locales/en.json'

type LocaleMessages = typeof en

const localeFiles = import.meta.glob('../../i18n/locales/*.json', {
  import: 'default',
  eager: true,
}) as Record<string, LocaleMessages>

const localeMessages = Object.entries(localeFiles).reduce<Record<string, LocaleMessages>>((acc, [path, messages]) => {
  const localeCode = path.split('/').pop()?.replace('.json', '')
  if (localeCode) {
    acc[localeCode] = messages
  }
  return acc
}, {})

export const useDocusI18n = () => {
  const config = useRuntimeConfig().public
  const appConfig = useAppConfig()
  const isEnabled = ref(!!config.i18n)

  if (!isEnabled.value) {
    const configuredLocale = appConfig.locale
    const messages = localeMessages[configuredLocale]

    if (!messages && configuredLocale !== 'en') {
      console.warn(`[Docus] Missing locale file for "${configuredLocale}". Falling back to "en".`)
    }

    const locale = messages ? configuredLocale : 'en'
    const resolvedMessages = messages || en

    return {
      isEnabled,
      locale: ref(locale),
      locales: [],
      localePath: (path: string) => path,
      switchLocalePath: () => {},
      t: (key: string): string => {
        const path = key.split('.')
        return path.reduce((acc: unknown, curr) => (acc as Record<string, unknown>)?.[curr], resolvedMessages) as string
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
