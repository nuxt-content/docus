<script setup lang="ts">
interface Props {
  size?: number
  dotSize?: number
  gap?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 4,
  dotSize: 2,
  gap: 2,
})

const totalDots = computed(() => props.size * props.size)
const activeDots = ref<Set<number>>(new Set())

// Patterns for 4x4 grid (indices 0-15)
// Grid layout:
//  0  1  2  3
//  4  5  6  7
//  8  9 10 11
// 12 13 14 15
const patterns = [
  // Spiral inward
  [[0], [1], [2], [3], [7], [11], [15], [14], [13], [12], [8], [4], [5], [6], [10], [9]],
  // Wave horizontal
  [[0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15]],
  // Diamond pulse
  [[5, 6, 9, 10], [1, 4, 7, 8, 11, 14], [0, 3, 12, 15], [1, 4, 7, 8, 11, 14], [5, 6, 9, 10]],
  // Loading bar
  [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]],
  // Corners rotate
  [[0], [3], [15], [12]],
  // Cross pulse
  [[5, 6, 9, 10], [1, 2, 4, 7, 8, 11, 13, 14], [0, 3, 12, 15]],
  // Snake
  [[0], [1], [2], [3], [7], [6], [5], [4], [8], [9], [10], [11], [15], [14], [13], [12]],
  // Diagonal wave
  [[0], [1, 4], [2, 5, 8], [3, 6, 9, 12], [7, 10, 13], [11, 14], [15]],
]

let patternIndex = 0
let stepIndex = 0
let interval: ReturnType<typeof setInterval> | null = null

function nextStep() {
  const pattern = patterns[patternIndex]
  if (!pattern) return

  activeDots.value = new Set(pattern[stepIndex])
  stepIndex++

  if (stepIndex >= pattern.length) {
    stepIndex = 0
    patternIndex = (patternIndex + 1) % patterns.length
  }
}

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.size}, 1fr)`,
  gap: `${props.gap}px`,
  width: `${props.size * props.dotSize + (props.size - 1) * props.gap}px`,
  height: `${props.size * props.dotSize + (props.size - 1) * props.gap}px`,
}))

const dotStyle = computed(() => ({
  width: `${props.dotSize}px`,
  height: `${props.dotSize}px`,
}))

onMounted(() => {
  interval = setInterval(nextStep, 120)
  nextStep()
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div :style="gridStyle">
    <span
      v-for="i in totalDots"
      :key="i"
      class="rounded-[0.5px] bg-current transition-opacity duration-100"
      :class="activeDots.has(i - 1) ? 'opacity-100' : 'opacity-20'"
      :style="dotStyle"
    />
  </div>
</template>
