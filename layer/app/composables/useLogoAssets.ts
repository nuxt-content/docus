import type { ContextMenuItem } from '@nuxt/ui'

function normalizeSvg(svg: string, name: string): string {
  let result = svg.replace(/fill="(black|white|#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))"/g, 'fill="currentColor"')

  // Inject id for Figma layer naming
  if (name) {
    result = result.replace(/<svg\b/, `<svg id="${name}"`)
    // Inject <title> right after <svg ...> for accessibility and Figma
    result = result.replace(/(<svg[^>]*>)/, `$1<title>${name}</title>`)
  }

  return result
}

async function fetchSvgContent(url: string, name: string): Promise<string | null> {
  try {
    const absoluteUrl = new URL(url, window.location.origin).href
    const response = await fetch(absoluteUrl)
    if (!response.ok) return null
    const text = await response.text()
    return normalizeSvg(text, name)
  }
  catch {
    return null
  }
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  }
  catch {
    return false
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const useLogoAssets = () => {
  const appConfig = useAppConfig()
  const colorMode = useColorMode()
  const toast = useToast()

  const hasLogo = computed(() => !!(appConfig.header?.logo?.light || appConfig.header?.logo?.dark))

  const currentLogoUrl = computed(() => {
    const logo = appConfig.header?.logo
    if (!logo) return ''
    if (colorMode.value === 'dark') return logo.dark || logo.light || ''
    return logo.light || logo.dark || ''
  })

  const hasWordmark = computed(() => {
    const wm = appConfig.header?.logo?.wordmark
    return !!(wm?.light || wm?.dark)
  })

  const currentWordmarkUrl = computed(() => {
    const wm = appConfig.header?.logo?.wordmark
    if (!wm) return ''
    if (colorMode.value === 'dark') return wm.dark || wm.light || ''
    return wm.light || wm.dark || ''
  })

  const faviconUrl = computed(() => appConfig.header?.logo?.favicon || '/favicon.ico')

  const logoAlt = computed(() => appConfig.header?.logo?.alt || appConfig.header?.title || '')

  const brandName = computed(() => appConfig.header?.title || logoAlt.value || '')

  const prefix = computed(() => {
    const name = brandName.value
    return name ? name.toLowerCase().replace(/\s+/g, '-') : 'logo'
  })

  const logoName = computed(() => {
    const name = brandName.value
    return name ? `${name} Logo` : 'Logo'
  })

  const wordmarkName = computed(() => {
    const name = brandName.value
    return name ? `${name} Wordmark` : 'Wordmark'
  })

  async function copyLogo() {
    const svg = await fetchSvgContent(currentLogoUrl.value, logoName.value)
    if (!svg) {
      toast.add({ title: 'Failed to copy logo', icon: 'i-lucide-circle-x', color: 'error' })
      return
    }
    const ok = await copyTextToClipboard(svg)
    toast.add(ok
      ? { title: 'Logo copied', icon: 'i-lucide-circle-check', color: 'success' }
      : { title: 'Failed to copy logo', icon: 'i-lucide-circle-x', color: 'error' },
    )
  }

  async function copyWordmark() {
    const svg = await fetchSvgContent(currentWordmarkUrl.value, wordmarkName.value)
    if (!svg) {
      toast.add({ title: 'Failed to copy wordmark', icon: 'i-lucide-circle-x', color: 'error' })
      return
    }
    const ok = await copyTextToClipboard(svg)
    toast.add(ok
      ? { title: 'Wordmark copied', icon: 'i-lucide-circle-check', color: 'success' }
      : { title: 'Failed to copy wordmark', icon: 'i-lucide-circle-x', color: 'error' },
    )
  }

  async function downloadLogo() {
    const svg = await fetchSvgContent(currentLogoUrl.value, logoName.value)
    if (!svg) return
    triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), `${prefix.value}-logo.svg`)
    toast.add({ title: 'Logo downloaded', icon: 'i-lucide-download', color: 'success' })
  }

  async function downloadWordmark() {
    const svg = await fetchSvgContent(currentWordmarkUrl.value, wordmarkName.value)
    if (!svg) return
    triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), `${prefix.value}-wordmark.svg`)
    toast.add({ title: 'Wordmark downloaded', icon: 'i-lucide-download', color: 'success' })
  }

  function downloadFavicon() {
    const url = faviconUrl.value
    const link = document.createElement('a')
    link.href = url
    link.download = `${prefix.value}-favicon${url.includes('.svg') ? '.svg' : '.ico'}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.add({ title: 'Favicon downloaded', icon: 'i-lucide-download', color: 'success' })
  }

  const brandAssetsUrl = computed(() => appConfig.header?.logo?.brandAssetsUrl || '')

  const contextMenuItems = computed(() => {
    if (!hasLogo.value) return []

    const copyGroup: ContextMenuItem[] = [
      { label: 'Copy logo', icon: 'i-lucide-copy', onSelect: copyLogo },
    ]
    if (hasWordmark.value) {
      copyGroup.push({ label: 'Copy wordmark', icon: 'i-lucide-copy', onSelect: copyWordmark })
    }

    const downloadGroup: ContextMenuItem[] = [
      { label: 'Download logo', icon: 'i-lucide-download', onSelect: downloadLogo },
    ]
    if (hasWordmark.value) {
      downloadGroup.push({ label: 'Download wordmark', icon: 'i-lucide-download', onSelect: downloadWordmark })
    }
    downloadGroup.push({ label: 'Download favicon', icon: 'i-lucide-download', onSelect: downloadFavicon })

    const items: ContextMenuItem[][] = [copyGroup, downloadGroup]

    if (brandAssetsUrl.value) {
      items.push([{
        label: 'Brand assets',
        icon: 'i-lucide-palette',
        onSelect() {
          window.open(brandAssetsUrl.value, '_blank')
        },
      }])
    }

    return items
  })

  return {
    hasLogo,
    currentLogoUrl,
    hasWordmark,
    currentWordmarkUrl,
    faviconUrl,
    logoAlt,
    contextMenuItems,
    copyLogo,
    downloadLogo,
    copyWordmark,
    downloadWordmark,
    downloadFavicon,
    copyTextToClipboard,
    fetchSvgContent,
  }
}
