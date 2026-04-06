export function useDocusColorMode() {
  const appConfig = useAppConfig()
  const forced = (appConfig.docus as { colorMode?: string })?.colorMode
  return {
    forced: forced === 'light' || forced === 'dark' ? forced : undefined,
  }
}
