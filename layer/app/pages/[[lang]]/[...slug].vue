<script setup lang="ts">
import { kebabCase } from 'scule'
import type { ContentNavigationItem } from '@nuxt/content'
import { findPageHeadline } from '@nuxt/content/utils'
import type { DocsPage } from '../../types'
import { findSurround } from '../../utils/navigation'

definePageMeta({
  layout: 'docs',
})

const route = useRoute()
const { t } = useDocusI18n()
const { isOpen } = useAssistant()
const appConfig = useAppConfig()
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const { data: page } = await useAsyncData(kebabCase(route.path), () => content.get<DocsPage['data']>(route.path) as Promise<DocsPage | null>)
const surround = computed(() => findSurround(navigation?.value, route.path))

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

// The leading h1 and paragraph stand in for a missing frontmatter `title` and `description`
const pageTitle = page.value.data.title || page.value.meta.title
const pageDescription = page.value.data.description || page.value.meta.description
const title = page.value.data.seo?.title || pageTitle
const description = page.value.data.seo?.description || pageDescription

const headline = ref(findPageHeadline(navigation?.value, page.value?.path))
const breadcrumbs = computed(() => findPageBreadcrumbs(navigation?.value, page.value?.path || ''))

useSeo({
  title,
  description,
  type: 'article',
  modifiedAt: (page.value.data as Record<string, unknown>).modifiedAt as string | undefined,
  breadcrumbs,
})
watch(() => navigation?.value, () => {
  headline.value = findPageHeadline(navigation?.value, page.value?.path) || headline.value
})

defineOgImage('Docs', {
  headline: headline.value,
  title: formatOgTitle(title),
  description: formatOgDescription(title, description),
})

const github = computed(() => appConfig.github ? appConfig.github : null)

const editLink = computed(() => {
  if (!github.value) {
    return
  }

  return [
    github.value.url,
    'edit',
    github.value.branch,
    github.value.rootDir,
    'content',
    `${page.value?.meta.stem}.${page.value?.meta.extension}`,
  ].filter(Boolean).join('/')
})
</script>

<template>
  <UPage
    v-if="page"
    :ui="isOpen ? { center: 'lg:col-span-10' } : undefined"
  >
    <UPageHeader
      :title="pageTitle"
      :description="pageDescription"
      :headline="headline"
      :ui="{
        wrapper: 'flex-row items-center flex-wrap justify-between',
      }"
    >
      <template #links>
        <UButton
          v-for="(link, index) in page.data.links"
          :key="index"
          size="sm"
          v-bind="link"
        />

        <LazyDocsPageHeaderLinks hydrate-on-idle />
      </template>
    </UPageHeader>

    <UPageBody>
      <ContentDocument :value="page" />

      <USeparator v-if="github">
        <div
          class="flex items-center gap-2 text-sm text-muted"
        >
          <UButton
            variant="link"
            color="neutral"
            :to="editLink"
            target="_blank"
            icon="i-lucide-pen"
            :ui="{ leadingIcon: 'size-4' }"
          >
            {{ t('docs.edit') }}
          </UButton>
          <template v-if="github?.url">
            <span>{{ t('common.or') }}</span>
            <UButton
              variant="link"
              color="neutral"
              :to="`${github.url}/issues/new/choose`"
              target="_blank"
              icon="i-lucide-alert-circle"
              :ui="{ leadingIcon: 'size-4' }"
            >
              {{ t('docs.report') }}
            </UButton>
          </template>
        </div>
      </USeparator>
      <LazyUContentSurround
        :surround="surround"
        hydrate-on-visible
      />
    </UPageBody>

    <template
      v-if="!isOpen"
      #right
    >
      <DocsAsideRight
        :page="page"
      />
    </template>
  </UPage>
</template>
