import { useRuntimeConfig, useCookie, useRoute, navigateTo } from '#imports'
import { ref, computed } from 'vue'

export interface VersionItem {
  label: string
  value: string
  tag?: string
}

export interface VersionsRuntimeConfig {
  strategy: 'prefix' | 'state'
  default: string
  items: VersionItem[]
}

export const useVersion = () => {
  const config = useRuntimeConfig().public
  const versionsConfig = (config.docus as { versions?: VersionsRuntimeConfig } | undefined)?.versions
  const isVersioned = ref(!!versionsConfig?.items?.length)

  if (!isVersioned.value || !versionsConfig) {
    return {
      isVersioned,
      version: ref(''),
      versions: [] as VersionItem[],
      switchVersion: (_v: string) => {},
      versionStrategy: 'prefix' as const,
    }
  }

  const items = versionsConfig.items
  const strategy = versionsConfig.strategy || 'prefix'
  const defaultVersion = versionsConfig.default || items[0]!.value

  const resolveVersionFromRoute = (): string => {
    if (strategy !== 'prefix') return defaultVersion
    const route = useRoute()
    const segments = route.path.split('/').filter(Boolean)

    const { isEnabled: isI18n } = useDocusI18n()
    const startIdx = isI18n.value ? 1 : 0

    const candidate = segments[startIdx]
    if (candidate && items.some(v => v.value === candidate)) {
      return candidate
    }
    return defaultVersion
  }

  const versionCookie = strategy === 'state'
    ? useCookie<string>('docus-version', { default: () => defaultVersion })
    : null

  const version = computed({
    get: () => {
      if (strategy === 'state') {
        return versionCookie!.value || defaultVersion
      }
      return resolveVersionFromRoute()
    },
    set: (v: string) => {
      if (strategy === 'state' && versionCookie) {
        versionCookie.value = v
      }
    },
  })

  const switchVersion = (targetVersion: string) => {
    if (!items.some(v => v.value === targetVersion)) return

    if (strategy === 'state') {
      version.value = targetVersion
      reloadNuxtApp()
      return
    }

    const route = useRoute()
    const currentVersion = version.value
    const currentPath = route.path

    let newPath: string
    if (currentVersion && currentPath.includes(`/${currentVersion}`)) {
      newPath = currentPath.replace(`/${currentVersion}`, `/${targetVersion}`)
    }
    else {
      const { isEnabled: isI18n, locale } = useDocusI18n()
      if (isI18n.value) {
        newPath = currentPath.replace(`/${locale.value}`, `/${locale.value}/${targetVersion}`)
      }
      else {
        newPath = `/${targetVersion}${currentPath}`
      }
    }

    navigateTo(newPath)
  }

  return {
    isVersioned,
    version,
    versions: items,
    switchVersion,
    versionStrategy: strategy,
  }
}
