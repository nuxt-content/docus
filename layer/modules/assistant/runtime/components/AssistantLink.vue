<script setup lang="ts">
const { url } = defineProps<{
  url: string
  label: string
}>()

const isExternal = computed(() => /^https?:\/\//.test(url))
</script>

<template>
  <UButton
    :to="url"
    :target="isExternal ? '_blank' : undefined"
    :label="label"
    :trailing-icon="isExternal ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-right'"
    size="xs"
    color="neutral"
    variant="outline"
    class="rounded-full align-middle"
  />
</template>
