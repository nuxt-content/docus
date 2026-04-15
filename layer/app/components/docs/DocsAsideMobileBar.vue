<script setup lang="ts">
import { useSubNavigation } from '../../composables/useSubNavigation'
import type { ContentTocLink } from '@nuxt/ui'

defineProps<{
  links?: ContentTocLink[]
}>()

const { subNavigationMode, sidebarNavigation, currentSection } = useSubNavigation()
const { t } = useDocusI18n()

const contentNavVariants = useUIConfig('contentNavigation')
const contentTocVariants = useUIConfig('contentToc')

const menuDrawerOpen = ref(false)
const tocDrawerOpen = ref(false)
</script>

<template>
  <div
    v-if="subNavigationMode"
    class="lg:hidden sticky top-(--ui-header-height) z-10 bg-default/75 backdrop-blur -mx-4 p-2 border-b border-dashed border-default flex justify-between"
  >
    <UDrawer
      v-model:open="menuDrawerOpen"
      direction="left"
      :title="currentSection?.title"
      :handle="false"
      inset
      side="left"
      :ui="{ content: 'w-full max-w-2/3' }"
    >
      <UButton
        :label="t('docs.menu')"
        icon="i-lucide-text-align-start"
        color="neutral"
        variant="link"
        size="xs"
        :aria-label="t('docs.menu')"
      />

      <template #body>
        <UContentNavigation
          :navigation="sidebarNavigation"
          :highlight="contentNavVariants.highlight ?? true"
          :highlight-color="contentNavVariants.highlightColor"
          :variant="contentNavVariants.variant ?? 'link'"
          :color="contentNavVariants.color"
          default-open
          trailing-icon="i-lucide-chevron-right"
          :ui="{ linkTrailingIcon: 'group-data-[state=open]:rotate-90' }"
        />
      </template>
    </UDrawer>

    <UDrawer
      v-model:open="tocDrawerOpen"
      direction="right"
      :handle="false"
      inset
      side="right"
      no-body-styles
      :ui="{ content: 'w-full max-w-2/3' }"
    >
      <UButton
        :label="t('docs.toc')"
        trailing-icon="i-lucide-chevron-right"
        color="neutral"
        variant="link"
        size="xs"
        :aria-label="t('docs.toc')"
      />

      <template #body>
        <UContentToc
          v-if="links?.length"
          :highlight="contentTocVariants.highlight ?? true"
          :highlight-color="contentTocVariants.highlightColor"
          :highlight-variant="contentTocVariants.highlightVariant"
          :color="contentTocVariants.color"
          :links="links"
          :open="true"
          default-open
          :ui="{
            root: '!mx-0 !px-1 top-0 overflow-visible',
            container: '!pt-0 border-b-0',
            trailingIcon: 'hidden',
            bottom: 'flex flex-col',
          }"
        >
          <template #bottom>
            <DocsAsideRightBottom />
          </template>
        </UContentToc>
      </template>
    </UDrawer>
  </div>
</template>
