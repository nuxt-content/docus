<script setup lang="ts">
import { useLocale } from '@nuxt/ui/composables/useLocale'

const props = defineProps<{
  open: boolean
}>()

const { t } = useLocale()

const lineClass = 'outline-none origin-center [transform-box:fill-box] transition-[translate,rotate,opacity] duration-400 ease-[cubic-bezier(0.34,1.36,0.64,1)]'
</script>

<template>
  <UButton
    size="sm"
    variant="ghost"
    color="neutral"
    class="-me-1.5"
    square
    :aria-label="props.open ? t('header.close') : t('header.open')"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line
        x1="4"
        y1="6"
        x2="20"
        y2="6"
        :class="[lineClass, props.open && 'translate-y-[6px] rotate-45']"
      />
      <line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        :class="[lineClass, props.open && 'opacity-0']"
      />
      <line
        x1="4"
        y1="18"
        x2="20"
        y2="18"
        :class="[lineClass, props.open && '-translate-y-[6px] -rotate-45']"
      />
    </svg>
  </UButton>
</template>
