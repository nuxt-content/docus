export function useUIConfig(componentName: string) {
  const appConfig = useAppConfig()
  return computed(() => {
    const ui = appConfig.ui as Record<string, Record<string, Record<string, unknown>>>
    return (ui?.[componentName]?.defaultVariants || {}) as Record<string, unknown>
  })
}
