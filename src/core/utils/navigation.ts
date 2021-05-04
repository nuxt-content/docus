import { pascalCase } from 'scule'
import { withoutTrailingSlash } from 'ufo'
import { useDB } from '../database'
import { useStorage } from '../storage'
import { NavItem } from '../../types/core'

const findLink = (links: NavItem[], to: string) => links.find(link => link.to === to)
// TODO
const findFirstChildTo = page => withoutTrailingSlash(page.to || `/${page.slug}`)
const slugToTitle = title => title && title.replace(/-/g, ' ').split(' ').map(pascalCase).join(' ')

const getPageLink = (page: any): NavItem => {
  const to = findFirstChildTo(page)
  return {
    slug: page.slug,
    to,
    // locale: string // ??
    title: page.title,
    locale: page.language,
    meta: {
      menuTitle: page.menuTitle || page.title || slugToTitle(to.split('/').pop()) || '',
      template: page.template,
      menu: page.menu,
      icon: page.icon,
      description: page.description
    },
    nav: (typeof page.nav === 'string' ? { slot: page.nav } : page.nav) || {},
    children: []
  }
}

export async function updateNavigation({ draft = false, defaultLocale = 'en' } = {}) {
  const { query } = useDB()
  const { storage } = useStorage()
  // Get fields
  draft = draft ? undefined : false
  const fields = [
    'title',
    'menu',
    'language',
    'menuTitle',
    'dir',
    'nav',
    'category',
    'slug',
    'version',
    'to',
    'icon',
    'description',
    'template'
  ]
  if (process.dev) fields.push('draft')

  // Query pages
  const pages = await query('/page', { deep: true })
    .where({ draft, nav: { $ne: false } })
    .only(fields)
    .sortBy('position', 'asc')
    .fetch()

  const languages: { [key: string]: any[] } = pages.reduce((map, page) => {
    const language = page.language || defaultLocale
    map[language] = map[language] || []
    map[language].push(page)
    return map
  }, {})

  const tasks = Object.entries(languages).map(async ([language, pages]) => {
    const body = createNav(pages)
    await storage.setItem(`data:docus:navigation:${language}.json`, {
      body
    })
  })

  await Promise.all(tasks)
}

function createNav(pages: any[]) {
  let depth = 0

  const links: NavItem[] = []

  // Add each page to navigation
  pages.forEach((_page: any) => {
    // TODO: Ignore files directly from core
    if (_page.slug.startsWith('_')) {
      return
    }
    const $page = getPageLink(_page)

    // To: '/docs/guide/hello.md' -> dirs: ['docs', 'guide']
    let dirs = $page.to.split('/').filter(_ => _)

    // Remove the file part (except if index.md)
    if (_page.slug !== '') {
      dirs = dirs.slice(0, -1)
    }

    if (!dirs.length) {
      $page.nav.slot = $page.nav.slot || 'header'
      return links.push($page)
    }

    let currentLinks = links
    let lastLink: NavItem

    dirs.forEach((dir: string, index: number) => {
      // If children has been disabled (nav.children = false)
      if (!currentLinks) return
      if (index > depth) depth = index

      let link: NavItem = findLink(currentLinks, '/' + dirs.slice(0, index + 1).join('/'))

      if (!link) {
        link = getPageLink({
          slug: dir
        })
        currentLinks.push(link)
      }
      currentLinks = link.children
      lastLink = link
    })

    if (!currentLinks) return

    // If index page, merge also with parent for metadata
    if (!$page.slug) {
      if (dirs.length === 1) $page.nav.slot = $page.nav.slot || 'header'

      Object.assign(lastLink, $page)
    } else {
      // Push page
      currentLinks.push($page)
    }
  })

  // Increment navDepth for files
  depth++

  // Assign to $docus
  return {
    depth,
    links
  }
}
