import type { ContentNavigationItem } from '@nuxt/content'

export const flattenNavigation = (items?: ContentNavigationItem[]): ContentNavigationItem[] => items?.flatMap(
  item => item.children
    ? flattenNavigation(item.children)
    : [item],
) || []

/**
 * Transform navigation data by stripping locale, version, and docs levels
 */
export function transformNavigation(
  data: ContentNavigationItem[],
  isI18nEnabled: boolean,
  locale?: string,
  isVersioned?: boolean,
  version?: string,
): ContentNavigationItem[] {
  let result = data

  if (isI18nEnabled && locale) {
    result = result.find(item => item.path === `/${locale}`)?.children || result
  }

  if (isVersioned && version) {
    result = result.find(item => item.path.endsWith(`/${version}`))?.children || result
  }

  const docsPrefix = isI18nEnabled && locale
    ? (isVersioned && version ? `/${locale}/${version}/docs` : `/${locale}/docs`)
    : (isVersioned && version ? `/${version}/docs` : '/docs')

  result = result.find(item => item.path === docsPrefix)?.children || result

  return result
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
