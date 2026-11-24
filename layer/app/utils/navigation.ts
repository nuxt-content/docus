import type { ContentNavigationItem } from '@nuxt/content'

export const flattenNavigation = (items?: ContentNavigationItem[]): ContentNavigationItem[] => items?.flatMap(
  item => item.children
    ? flattenNavigation(item.children)
    : [item],
) || []

/**
 * Transform navigation data by stripping locale and docs levels, and the landing page
 */
export function transformNavigation(
  data: ContentNavigationItem[],
  isI18nEnabled: boolean,
  locale?: string,
): ContentNavigationItem[] {
  const root = isI18nEnabled && locale ? `/${locale}` : ''
  const localeResult = root ? data.find(item => item.path === root)?.children || data : data
  const items = localeResult.find(item => item.path === `${root}/docs`)?.children || localeResult

  // The landing page shares the docs source but isn't a docs page
  return items.filter(item => item.path !== (root || '/'))
}

/**
 * Previous and next pages in reading order. A folder is skipped when it has no page or lists its own index.
 */
export function findSurround(
  navigation: ContentNavigationItem[] | undefined,
  path: string,
): [ContentNavigationItem | null, ContentNavigationItem | null] {
  const flatten = (items: ContentNavigationItem[]): ContentNavigationItem[] => items.flatMap((item) => {
    const children = item.children ? flatten(item.children) : []
    if (item.page === false || children.some(child => child.path === item.path)) {
      return children
    }
    return [{ ...item, children: undefined }, ...children]
  })

  const pages = flatten(navigation || [])
  const index = pages.findIndex(item => item.path === path)
  if (index === -1) return [null, null]

  return [pages[index - 1] || null, pages[index + 1] || null]
}

export interface BreadcrumbItem {
  title: string
  path: string
}

/**
 * Find breadcrumb path to a page in the navigation tree
 */
export function findPageBreadcrumbs(
  navigation: ContentNavigationItem[] | undefined,
  path: string,
  currentPath: BreadcrumbItem[] = [],
): BreadcrumbItem[] | undefined {
  if (!navigation) return undefined

  for (const item of navigation) {
    const itemPath = [...currentPath, { title: item.title, path: item.path }]

    if (item.path === path) {
      return itemPath
    }

    if (item.children) {
      const found = findPageBreadcrumbs(item.children, path, itemPath)
      if (found) return found
    }
  }

  return undefined
}
