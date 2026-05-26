import { useDocusColorMode } from './useDocusColorMode'

export function useDocusShortcuts() {
  const appConfig = useAppConfig()
  const { forced: forcedColorMode } = useDocusColorMode()
  const colorMode = useColorMode()
  const toggleColorModeShortcut = computed(() => appConfig.docus?.shortcuts?.toggleColorMode ?? 'd')

  const shortcuts = computed(() => {
    const key = toggleColorModeShortcut.value
    if (!key) return {}

    return {
      [key]: {
        handler: () => {
          if (forcedColorMode) return
          colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
        },
      },
    }
  })

  defineShortcuts(shortcuts)
}
