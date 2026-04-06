<script setup lang="ts">
import { useSubNavigation } from '../../composables/useSubNavigation'
import type { DocsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  page?: DocsCollectionItem | null
}>()

const links = computed(() => props.page?.body?.toc?.links || [])

const { isOpen: isAssistantOpen } = useAssistant()
const { subNavigationMode } = useSubNavigation()
const appConfig = useAppConfig()
const { t } = useDocusI18n()
</script>

<template>
  <div>
    <UContentToc
      v-if="links.length && !isAssistantOpen"
      highlight
      :title="appConfig.toc?.title || t('docs.toc')"
      :links="links"
      :class="{ 'hidden lg:block': subNavigationMode }"
    >
      <template #bottom>
        <DocsAsideRightBottom />
      </template>
    </UContentToc>

    <DocsAsideMobileBar :links="links" />
  </div>
</template>
