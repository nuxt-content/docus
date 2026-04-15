<script setup lang="ts">
const { sidebarNavigation } = useSubNavigation()

const contentNavVariants = useUIConfig('contentNavigation')
</script>

<template>
  <UContentNavigation
    :highlight="contentNavVariants.highlight ?? true"
    :highlight-color="contentNavVariants.highlightColor"
    :variant="contentNavVariants.variant ?? 'link'"
    :color="contentNavVariants.color"
    :navigation="sidebarNavigation"
  />
</template>
