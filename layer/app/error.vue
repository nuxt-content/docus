<script setup lang="ts">
import type { NuxtError } from '#app'
import type { ContentNavigationItem, PageCollections } from '@nuxt/content'
import { uiLocales } from '#build/docus/ui-locales.mjs'
import { getLocaleKey } from '../utils/locale'
import { transformNavigation } from './utils/navigation'
import { useSubNavigation } from './composables/useSubNavigation'

const props = defineProps<{
  error: NuxtError
}>()

const { locale, locales, isEnabled, t, switchLocalePath } = useDocusI18n()

const nuxtApp = useNuxtApp()
const nuxtUiLocale = computed(() => uiLocales[getLocaleKey(locale.value)] || (nuxtApp.$uiLocale as typeof uiLocales[string] | undefined) || uiLocales.en!)
const lang = computed(() => nuxtUiLocale.value.code)
const dir = computed(() => nuxtUiLocale.value.dir)

useHead({
  htmlAttrs: {
    lang,
    dir,
  },
})

const localizedError = computed(() => {
  return {
    ...props.error,
    statusMessage: t('common.error.title'),
    message: t('common.error.description'),
  }
})

useSeoMeta({
  title: () => t('common.error.title'),
  description: () => t('common.error.description'),
})

if (isEnabled.value) {
  const route = useRoute()
  // Only typed when `@nuxtjs/i18n` is installed in the app.
  const defaultLocale = (useRuntimeConfig().public.i18n as { defaultLocale: string }).defaultLocale
  onMounted(() => {
    const currentLocale = route.path.split('/')[1]
    if (!locales.some(locale => locale.code === currentLocale)) {
      return navigateTo(switchLocalePath(defaultLocale) as string)
    }
  })
}

const collectionName = computed(() => isEnabled.value ? `docs_${getLocaleKey(locale.value)}` : 'docs')

const { data: navigation } = await useAsyncData(`navigation_${collectionName.value}`, () => queryCollectionNavigation(collectionName.value as keyof PageCollections), {
  transform: (data: ContentNavigationItem[]) => transformNavigation(data, isEnabled.value, locale.value),
  watch: [locale],
})

provide('navigation', navigation)

const { subNavigationMode } = useSubNavigation(navigation)
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <div
      class="flex flex-col min-h-svh"
      :class="{ 'docus-sub-header': subNavigationMode === 'header' }"
    >
      <AppHeader />

      <UError
        :error="localizedError"
        class="flex-1 min-h-auto"
      />

      <LazyAppFooter hydrate-on-visible />
    </div>

    <ClientOnly>
      <AppSearch :navigation="navigation" />
    </ClientOnly>
  </UApp>
</template>
