import { computed } from 'vue'

export const useCollectionName = (type: 'docs' | 'landing' = 'docs') => {
  const { version, isVersioned } = useVersion()
  const { locale, isEnabled: isI18n } = useDocusI18n()

  return computed(() => {
    let name: string = type
    if (type === 'docs' && isVersioned.value && version.value) {
      name += `_${version.value}`
    }
    if (isI18n.value) {
      name += `_${locale.value}`
    }
    return name
  })
}
