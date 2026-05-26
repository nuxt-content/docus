import { useDocusColorMode } from './useDocusColorMode'

export function useDocusShortcuts() {
  const { forced: forcedColorMode } = useDocusColorMode()
  const colorMode = useColorMode()

  defineShortcuts({
    d: {
      handler: () => {
        if (forcedColorMode) return
        colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
      },
    },
  })
}
