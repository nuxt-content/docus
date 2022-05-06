import { withoutTrailingSlash } from 'ufo'
import type { NavItem, ParsedContent } from '@nuxt/content/dist/runtime/types'
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router'
import { useDocusState } from './state'
import { fetchContentNavigation, queryContent, useDocus, useDocusNavigation } from '#imports'
import layouts from '#build/layouts'

const findLayout = (page: ParsedContent, theme: any, navigation: NavItem[]) => {
  if (page.layout) return page.layout

  const { layoutFromPath } = useDocusNavigation()
  const layoutFromNav = layoutFromPath(page.slug, navigation)
  if (layoutFromNav) return layoutFromNav

  return theme.layout
}

export const queryPage = async (route: RouteLocationNormalized | RouteLocationNormalizedLoaded, force = false) => {
  const path = withoutTrailingSlash(route.path)

  const { page, surround, navigation } = useDocusState()

  // We can use `theme` from useDocus here as we know this middleware
  // will always run after `theme` middleware, but this is not a recommended pattern.
  // Queries should avoid depending on each others.
  const { theme } = useDocus()

  // Page is already fetched, apply it
  if (!force && page.value && page.value.slug === path) {
    route.meta.layout = findLayout(page.value, theme.value, navigation.value)
    return
  }

  // Fetch page
  try {
    return await Promise.all([
      queryContent().where({ slug: path }).findOne() as Promise<ParsedContent>,
      queryContent()
        .where({ partial: { $not: true }, navigation: { $not: false } })
        .findSurround(path) as Promise<ParsedContent[]>,
    ]).then(async ([_page, _surround]) => {
      const layoutName = findLayout(_page, theme.value, navigation.value)

      // Prefetch layout component
      const layout = layouts[layoutName]
      if (layout?.__asyncLoader && !layout.__asyncResolved) {
        await layout.__asyncLoader()
      }

      // Update values
      route.meta.layout = layoutName
      if (_page) page.value = _page
      else page.value = undefined

      if (_surround && _surround.length) surround.value = _surround
      else surround.value = undefined
    })
  } catch (e) {
    console.warn(`Could not find page for path ${path}`)
    page.value = undefined
    surround.value = undefined
  }
}

export const queryNavigation = async (force = false) => {
  const { navigation } = useDocusState()

  if (!force && navigation.value) return

  await fetchContentNavigation(
    queryContent().where({
      navigation: {
        $not: false,
      },
    }),
  ).then((_navigation) => {
    navigation.value = _navigation
  })
}

export const queryTheme = async (force = false) => {
  const { theme } = useDocusState()

  if (!force && theme.value) return

  // Fetch _theme.yml at `content/` root.
  await queryContent()
    .where({
      id: 'content:_theme.yml',
    })
    .findOne()
    .then((_theme) => {
      if (!_theme) {
        console.warn('Could not find _theme.yml!')
        return
      }

      theme.value = _theme.body
    })
}
