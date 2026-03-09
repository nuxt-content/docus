<script setup lang="ts">
const { sidebarNavigation } = useSubNavigation()
</script>

<template>
  <UContentNavigation
    highlight
    :navigation="sidebarNavigation"
  />
</template>
