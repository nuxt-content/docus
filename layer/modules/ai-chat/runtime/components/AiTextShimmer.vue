<script setup lang="ts">
import { motion } from 'motion-v'

interface Props {
  text: string
  as?: string
  duration?: number
  spread?: number
}

const props = withDefaults(defineProps<Props>(), {
  as: 'p',
  duration: 2,
  spread: 2,
})

const dynamicSpread = computed(() => props.text.length * props.spread)
</script>

<template>
  <component
    :is="motion[as]"
    :animate="{ backgroundPosition: '0% center' }"
    :initial="{ backgroundPosition: '100% center' }"
    :transition="{
      repeat: Infinity,
      duration,
      ease: 'linear',
    }"
    :style="{
      '--spread': `${dynamicSpread}px`,
      'backgroundImage': 'var(--bg), linear-gradient(var(--color-neutral-600), var(--color-neutral-600))',
    }"
    class="relative inline-block bg-size-[250%_100%,auto] bg-clip-text text-transparent [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-gray-100),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]"
  >
    {{ text }}
  </component>
</template>
