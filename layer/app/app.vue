<script setup lang="ts">
import type { ContentNavigationItem, PageCollections } from '@nuxt/content'
import * as nuxtUiLocales from '@nuxt/ui/locale'

const { seo } = useAppConfig()
const site = useSiteConfig()
const { locale, locales, isEnabled, switchLocalePath } = useDocusI18n()

const nuxtUiLocale = computed(() => nuxtUiLocales[locale.value as keyof typeof nuxtUiLocales] || nuxtUiLocales.en)
const lang = computed(() => nuxtUiLocale.value.code)
const dir = computed(() => nuxtUiLocale.value.dir)
const collectionName = computed(() => isEnabled.value ? `docs_${locale.value}` : 'docs')

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
  ],
  htmlAttrs: {
    lang,
    dir,
  },
})

useSeoMeta({
  titleTemplate: seo.titleTemplate,
  title: seo.title,
  description: seo.description,
  ogSiteName: site.name,
  twitterCard: 'summary_large_image',
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

const { data: navigation } = await useAsyncData(() => `navigation_${collectionName.value}`, () => queryCollectionNavigation(collectionName.value as keyof PageCollections), {
  transform: (data: ContentNavigationItem[]) => {
    const rootResult = data.find(item => item.path === '/docs')?.children || data || []

    return rootResult.find(item => item.path === `/${locale.value}`)?.children || rootResult
  },
  watch: [locale],
})
const { data: files } = useLazyAsyncData(`search_${collectionName.value}`, () => queryCollectionSearchSections(collectionName.value as keyof PageCollections), {
  server: false,
  watch: [locale],
})

provide('navigation', navigation)
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <AppHeader v-if="$route.meta.header !== false" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppFooter v-if="$route.meta.footer !== false" />

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
      />
    </ClientOnly>
  </UApp>
</template>
