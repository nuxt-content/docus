import type { ContentNavigationItem } from '@nuxt/content'

function getFirstPagePath(item: ContentNavigationItem): string {
  if (item.children?.length) return getFirstPagePath(item.children[0]!)
  return item.path
}

export function useSubNavigation() {
  const route = useRoute()
  const appConfig = useAppConfig()
  const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

  const isDocsPage = computed(() => route.meta.layout === 'docs')

  const hasSubHeader = computed(() => {
    if (!(appConfig.header as { subNavigation?: boolean })?.subNavigation || !isDocsPage.value) return false
    const items = navigation?.value
    if (!items || items.length < 2) return false
    return items.filter(item => item.children?.length).length >= 2
  })

  const currentSection = computed(() => {
    if (!hasSubHeader.value || !navigation?.value) return undefined
    return navigation.value.find(item =>
      route.path === item.path || route.path.startsWith(item.path + '/'),
    )
  })

  const sections = computed(() => {
    if (!hasSubHeader.value || !navigation?.value) return []
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
    if (hasSubHeader.value && currentSection.value) {
      return currentSection.value.children || []
    }
    return navigation?.value || []
  })

  return {
    hasSubHeader,
    sections,
    currentSection,
    sidebarNavigation,
  }
}
