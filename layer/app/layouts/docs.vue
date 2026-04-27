<script setup lang="ts">
import { useVersion } from '../composables/useVersion'

const { isVersioned, versions } = useVersion()
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <template #left>
          <UPageAside>
            <template v-if="isVersioned && versions.length > 1">
              <VersionSelect />
              <USeparator
                type="dashed"
                class="my-3"
              />
            </template>
            <DocsAsideLeftTop />
            <DocsAsideLeftBody />
          </UPageAside>
        </template>
        <slot />
      </UPage>
    </UContainer>
  </UMain>
</template>
