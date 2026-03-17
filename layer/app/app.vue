<script setup lang="ts">
import type { ContentNavigationItem, PageCollections } from '@nuxt/content'
import * as nuxtUiLocales from '@nuxt/ui/locale'
import { transformNavigation } from './utils/navigation'
import { useSubNavigation } from './composables/useSubNavigation'
import { useVersion } from './composables/useVersion'
import { useCollectionName } from './composables/useCollectionName'

const { seo } = useAppConfig()
const site = useSiteConfig()
const { locale, locales, isEnabled, switchLocalePath } = useDocusI18n()
const { isEnabled: isAssistantEnabled, panelWidth: assistantPanelWidth, shouldPushContent } = useAssistant()
const { version, isVersioned } = useVersion()

const nuxtUiLocale = computed(() => nuxtUiLocales[locale.value as keyof typeof nuxtUiLocales] || nuxtUiLocales.en)
const lang = computed(() => nuxtUiLocale.value.code)
const dir = computed(() => nuxtUiLocale.value.dir)
const collectionName = useCollectionName('docs')

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
  transform: (data: ContentNavigationItem[]) => transformNavigation(data, isEnabled.value, locale.value, isVersioned.value, version.value),
  watch: [locale, version],
})
const { data: files } = useLazyAsyncData(`search_${collectionName.value}`, () => queryCollectionSearchSections(collectionName.value as keyof PageCollections), {
  server: false,
  watch: [locale, version],
})

provide('navigation', navigation)

const { subNavigationMode } = useSubNavigation(navigation)
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <div
      :class="['transition-[margin-right] duration-200 ease-linear will-change-[margin-right]', { 'docus-sub-header': subNavigationMode === 'header' }]"
      :style="{ marginRight: shouldPushContent ? `${assistantPanelWidth}px` : '0' }"
    >
      <AppHeader v-if="$route.meta.header !== false" />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <AppFooter v-if="$route.meta.footer !== false" />
    </div>

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
      />
      <template v-if="isAssistantEnabled">
        <LazyAssistantPanel />
        <LazyAssistantFloatingInput />
      </template>
    </ClientOnly>
  </UApp>
</template>

<style>
@media (min-width: 1024px) {
  .docus-sub-header {
    /* 64px base header + 48px sub-navigation bar */
    --ui-header-height: 112px;
  }
}
</style>
