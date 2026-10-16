<script setup lang="ts">
// Content v4: `ContentRenderer` maps links to a bare `NuxtLink` and drops v3's `rel="nofollow"` on external ones.
const props = defineProps<{
  href?: string
  target?: '_blank' | '_parent' | '_self' | '_top' | null
}>()

const rel = computed(() => props.href && /^https?:\/\//.test(props.href) ? 'nofollow' : undefined)
</script>

<template>
  <ProseA
    :href="href"
    :target="target"
    :rel="rel"
  >
    <slot />
  </ProseA>
</template>
