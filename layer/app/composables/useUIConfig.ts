type UIColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

interface UIConfigMap {
  contentToc: {
    highlight?: boolean
    highlightColor?: UIColor
    highlightVariant?: 'straight' | 'circuit'
    color?: UIColor
  }
  contentNavigation: {
    highlight?: boolean
    highlightColor?: UIColor
    variant?: 'pill' | 'link'
    color?: UIColor
  }
  navigationMenu: {
    highlight?: boolean
    highlightColor?: UIColor
    variant?: 'pill' | 'link'
    color?: UIColor
  }
}

export function useUIConfig<K extends keyof UIConfigMap>(componentName: K): ComputedRef<UIConfigMap[K]> {
  const appConfig = useAppConfig()
  return computed(() => {
    const ui = appConfig.ui as Record<string, Record<string, Record<string, unknown>>>
    return (ui?.[componentName]?.defaultVariants || {}) as UIConfigMap[K]
  })
}
