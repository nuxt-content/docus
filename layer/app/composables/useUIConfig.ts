export function useUIConfig<T extends Record<string, any>>(componentName: string) {
  const appConfig = useAppConfig()
  return computed(() => ((appConfig.ui as Record<string, any>)?.[componentName]?.defaultVariants || {}) as T)
}
