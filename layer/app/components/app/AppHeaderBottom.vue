<script setup lang="ts">
import { useSubNavigation } from '../../composables/useSubNavigation'

const { sections } = useSubNavigation()

const navMenuVariants = useUIConfig('navigationMenu')
</script>

<template>
  <USeparator class="hidden lg:flex" />

  <UContainer class="hidden lg:flex items-center justify-between">
    <UNavigationMenu
      :items="sections"
      :highlight="navMenuVariants.highlight ?? true"
      :highlight-color="navMenuVariants.highlightColor"
      :variant="navMenuVariants.variant ?? 'pill'"
      :color="navMenuVariants.color"
      class="-mx-2.5 -mb-px"
    />

    <AppHeaderBottomRight />
  </UContainer>
</template>
