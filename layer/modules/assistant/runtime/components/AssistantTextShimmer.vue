<script setup lang="ts">
import { motion } from 'motion-v'

interface Props {
  text: string
  as?: keyof typeof motion
  duration?: number
  spread?: number
}

const props = withDefaults(defineProps<Props>(), {
  as: 'p',
  duration: 2,
  spread: 2,
})

const dynamicSpread = computed(() => props.text.length * props.spread)
const MotionComponent = computed(() => motion[props.as])
</script>

<template>
  <component
    :is="MotionComponent"
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
    class="relative inline-block bg-size-[250%_100%,auto] bg-clip-text text-transparent [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-neutral-100),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]"
  >
    {{ text }}
  </component>
</template>
