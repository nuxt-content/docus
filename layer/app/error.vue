<script setup lang="ts">
import type { NuxtError } from '#app'
import type { PageCollections } from '@nuxt/content'
import * as nuxtUiLocales from '@nuxt/ui/locale'

const props = defineProps<{
  error: NuxtError
}>()

const { locale, locales, isEnabled, t, switchLocalePath } = useDocusI18n()

const lang = computed(() => nuxtUiLocales[locale.value as keyof typeof nuxtUiLocales]?.code || 'en')
const dir = computed(() => nuxtUiLocales[locale.value as keyof typeof nuxtUiLocales]?.dir || 'ltr')
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
  }
})

useSeoMeta({
  title: () => t('common.error.title'),
  description: () => t('common.error.description'),
})

if (isEnabled.value) {
  const route = useRoute()
  const defaultLocale = useRuntimeConfig().public.i18n.defaultLocale!
  onMounted(() => {
    const currentLocale = route.path.split('/')[1]
    if (!locales.some(locale => locale.code === currentLocale)) {
      return navigateTo(switchLocalePath(defaultLocale) as string)
    }
  })
}

const collectionName = computed(() => isEnabled.value ? `docs_${locale.value}` : 'docs')

const { data: navigation } = await useAsyncData(`navigation_${collectionName.value}`, () => queryCollectionNavigation(collectionName.value as keyof PageCollections), {
  transform: (data) => {
    const rootResult = data.find(item => item.path === '/docs')?.children || data || []

    return rootResult.find(item => item.path === `/${locale.value}`)?.children || rootResult
  },
  watch: [locale],
})
const { data: files } = useLazyAsyncData(`search_${collectionName.value}`, () => queryCollectionSearchSections(collectionName.value as keyof PageCollections), {
  server: false,
})

provide('navigation', navigation)
</script>

<template>
  <UApp>
    <AppHeader />

    <UError :error="localizedError" />

    <AppFooter />

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
      />
    </ClientOnly>
  </UApp>
</template>
