import type { ContextMenuItem } from '@nuxt/ui'

function isSvgUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.svg')
}

function getExtension(url: string): string {
  const match = url.match(/\.([a-z0-9]+)(?:\?|$)/i)
  return match?.[1] ? `.${match[1].toLowerCase()}` : '.png'
}

function normalizeSvg(svg: string, name: string): string {
  let result = svg.replace(/fill="(black|white|#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))"/g, 'fill="currentColor"')

  if (name) {
    result = result.replace(/<svg\b/, `<svg id="${name}"`)
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

function triggerLinkDownload(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const useLogoAssets = () => {
  const appConfig = useAppConfig()
  const colorMode = useColorMode()
  const toast = useToast()
  const { t } = useDocusI18n()

  const hasLogo = computed(() => !!(appConfig.header?.logo?.light || appConfig.header?.logo?.dark))

  const displayMode = computed(() => appConfig.header?.logo?.display || 'logo')

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

  const headerLightUrl = computed(() => {
    const logo = appConfig.header?.logo
    if (!logo) return ''
    if (displayMode.value === 'wordmark' && hasWordmark.value) {
      return logo.wordmark?.light || logo.wordmark?.dark || logo.light || logo.dark || ''
    }
    return logo.light || logo.dark || ''
  })

  const headerDarkUrl = computed(() => {
    const logo = appConfig.header?.logo
    if (!logo) return ''
    if (displayMode.value === 'wordmark' && hasWordmark.value) {
      return logo.wordmark?.dark || logo.wordmark?.light || logo.dark || logo.light || ''
    }
    return logo.dark || logo.light || ''
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

  const logoIsSvg = computed(() => isSvgUrl(currentLogoUrl.value))
  const wordmarkIsSvg = computed(() => isSvgUrl(currentWordmarkUrl.value))

  async function copyLogo() {
    if (!logoIsSvg.value) return
    const svg = await fetchSvgContent(currentLogoUrl.value, logoName.value)
    if (!svg) {
      toast.add({ title: t('logo.copyLogoFailed'), icon: 'i-lucide-circle-x', color: 'error' })
      return
    }
    const ok = await copyTextToClipboard(svg)
    toast.add(ok
      ? { title: t('logo.logoCopied'), icon: 'i-lucide-circle-check', color: 'success' }
      : { title: t('logo.copyLogoFailed'), icon: 'i-lucide-circle-x', color: 'error' },
    )
  }

  async function copyWordmark() {
    if (!wordmarkIsSvg.value) return
    const svg = await fetchSvgContent(currentWordmarkUrl.value, wordmarkName.value)
    if (!svg) {
      toast.add({ title: t('logo.copyWordmarkFailed'), icon: 'i-lucide-circle-x', color: 'error' })
      return
    }
    const ok = await copyTextToClipboard(svg)
    toast.add(ok
      ? { title: t('logo.wordmarkCopied'), icon: 'i-lucide-circle-check', color: 'success' }
      : { title: t('logo.copyWordmarkFailed'), icon: 'i-lucide-circle-x', color: 'error' },
    )
  }

  async function downloadLogo() {
    const url = currentLogoUrl.value
    if (logoIsSvg.value) {
      const svg = await fetchSvgContent(url, logoName.value)
      if (!svg) return
      triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), `${prefix.value}-logo.svg`)
    }
    else {
      triggerLinkDownload(url, `${prefix.value}-logo${getExtension(url)}`)
    }
    toast.add({ title: t('logo.logoDownloaded'), icon: 'i-lucide-download', color: 'success' })
  }

  async function downloadWordmark() {
    const url = currentWordmarkUrl.value
    if (wordmarkIsSvg.value) {
      const svg = await fetchSvgContent(url, wordmarkName.value)
      if (!svg) return
      triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), `${prefix.value}-wordmark.svg`)
    }
    else {
      triggerLinkDownload(url, `${prefix.value}-wordmark${getExtension(url)}`)
    }
    toast.add({ title: t('logo.wordmarkDownloaded'), icon: 'i-lucide-download', color: 'success' })
  }

  const brandAssetsUrl = computed(() => appConfig.header?.logo?.brandAssetsUrl || '')

  const contextMenuItems = computed(() => {
    if (!hasLogo.value) return []

    const copyGroup: ContextMenuItem[] = []
    if (logoIsSvg.value) {
      copyGroup.push({ label: t('logo.copyLogo'), icon: 'i-lucide-copy', onSelect: copyLogo })
    }
    if (hasWordmark.value && wordmarkIsSvg.value) {
      copyGroup.push({ label: t('logo.copyWordmark'), icon: 'i-lucide-copy', onSelect: copyWordmark })
    }

    const downloadGroup: ContextMenuItem[] = [
      { label: t('logo.downloadLogo'), icon: 'i-lucide-download', onSelect: downloadLogo },
    ]
    if (hasWordmark.value) {
      downloadGroup.push({ label: t('logo.downloadWordmark'), icon: 'i-lucide-download', onSelect: downloadWordmark })
    }

    const items: ContextMenuItem[][] = []
    if (copyGroup.length) items.push(copyGroup)
    items.push(downloadGroup)

    if (brandAssetsUrl.value) {
      items.push([{
        label: t('logo.brandAssets'),
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
    displayMode,
    currentLogoUrl,
    headerLightUrl,
    headerDarkUrl,
    hasWordmark,
    currentWordmarkUrl,
    faviconUrl,
    logoAlt,
    contextMenuItems,
    copyLogo,
    downloadLogo,
    copyWordmark,
    downloadWordmark,
    copyTextToClipboard,
    fetchSvgContent,
  }
}
