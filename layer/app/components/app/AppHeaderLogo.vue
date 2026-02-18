<script setup lang="ts">
const appConfig = useAppConfig()
const { hasLogo, contextMenuItems } = useLogoAssets()
</script>

<template>
  <UContextMenu
    v-if="hasLogo"
    :items="contextMenuItems"
  >
    <UColorModeImage
      :light="appConfig.header?.logo?.light || appConfig.header?.logo?.dark"
      :dark="appConfig.header?.logo?.dark || appConfig.header?.logo?.light"
      :alt="appConfig.header?.logo?.alt || appConfig.header?.title"
      class="h-6 w-auto shrink-0"
    />
  </UContextMenu>
  <span v-else>
    {{ appConfig.header?.title || '{appConfig.header.title}' }}
  </span>
</template>
