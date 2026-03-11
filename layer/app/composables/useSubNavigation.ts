import type { ContentNavigationItem } from '@nuxt/content'

function getFirstPagePath(item: ContentNavigationItem): string {
  let current = item
  while (current.children?.length) {
    current = current.children[0]!
  }
  return current.path
}

export function useSubNavigation(providedNavigation?: Ref<ContentNavigationItem[] | null | undefined>) {
  const route = useRoute()
  const appConfig = useAppConfig()
  const navigation = providedNavigation ?? inject<Ref<ContentNavigationItem[]>>('navigation')

  const isDocsPage = computed(() => route.meta.layout === 'docs')

  const subNavigationMode = computed(() => {
    if (!isDocsPage.value) return undefined
    return (appConfig.navigation as { sub?: 'header' | 'aside' } | undefined)?.sub
  })

  const currentSection = computed(() => {
    if (!subNavigationMode.value || !navigation?.value) return undefined
    return navigation.value.find(item =>
      route.path === item.path || route.path.startsWith(item.path + '/'),
    )
  })

  const sections = computed(() => {
    if (!subNavigationMode.value || !navigation?.value) return []
    return navigation.value
      .filter(item => item.children?.length)
      .map(item => ({
        label: item.title,
        icon: item.icon as string | undefined,
        to: getFirstPagePath(item),
        active: route.path === item.path || route.path.startsWith(item.path + '/'),
      }))
  })

  const sidebarNavigation = computed(() => {
    if (subNavigationMode.value && currentSection.value) {
      return currentSection.value.children || []
    }
    return navigation?.value || []
  })

  return {
    subNavigationMode,
    sections,
    currentSection,
    sidebarNavigation,
  }
}
