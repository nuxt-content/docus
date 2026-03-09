<script setup lang="ts">
const { sections } = useSubNavigation()
</script>

<template>
  <USeparator class="hidden lg:flex" />

  <UContainer class="hidden lg:flex items-center justify-between">
    <UNavigationMenu
      :items="sections"
      variant="pill"
      highlight
      class="-mx-2.5 -mb-px"
    />

    <AppHeaderBottomRight />
  </UContainer>
</template>
