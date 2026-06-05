<script setup lang="ts">
const size = 4
const dotSize = 2
const gap = 2
const totalDots = size * size

const patterns = [
  [[0], [1], [2], [3], [7], [11], [15], [14], [13], [12], [8], [4], [5], [6], [10], [9]],
  [[0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15]],
  [[5, 6, 9, 10], [1, 4, 7, 8, 11, 14], [0, 3, 12, 15], [1, 4, 7, 8, 11, 14], [5, 6, 9, 10]],
  [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]],
  [[0], [3], [15], [12]],
  [[5, 6, 9, 10], [1, 2, 4, 7, 8, 11, 13, 14], [0, 3, 12, 15]],
  [[0], [1], [2], [3], [7], [6], [5], [4], [8], [9], [10], [11], [15], [14], [13], [12]],
  [[0], [1, 4], [2, 5, 8], [3, 6, 9, 12], [7, 10, 13], [11, 14], [15]],
]

const activeDots = ref<Set<number>>(new Set())
let patternIndex = 0
let stepIndex = 0

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

const statusMessages = ['Thinking...', 'Searching...', 'Reading...', 'Analyzing...']
const currentIndex = ref(0)
const displayedText = ref(statusMessages[0]!)
const chars = 'abcdefghijklmnopqrstuvwxyz'

function scramble(from: string, to: string) {
  const maxLength = Math.max(from.length, to.length)
  let frame = 0
  const totalFrames = 15

  const step = () => {
    frame++
    let result = ''
    const progress = (frame / totalFrames) * maxLength

    for (let i = 0; i < maxLength; i++) {
      if (i < progress - 2) {
        result += to[i] || ''
      }
      else if (i < progress) {
        result += chars[Math.floor(Math.random() * chars.length)]
      }
      else {
        result += from[i] || ''
      }
    }

    displayedText.value = result

    if (frame < totalFrames) {
      requestAnimationFrame(step)
    }
    else {
      displayedText.value = to
    }
  }

  requestAnimationFrame(step)
}

let matrixInterval: ReturnType<typeof setInterval> | undefined
let textInterval: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  nextStep()
  matrixInterval = setInterval(nextStep, 120)
  textInterval = setInterval(() => {
    const prev = displayedText.value
    currentIndex.value = (currentIndex.value + 1) % statusMessages.length
    scramble(prev, statusMessages[currentIndex.value]!)
  }, 3500)
})

onUnmounted(() => {
  clearInterval(matrixInterval)
  clearInterval(textInterval)
})
</script>

<template>
  <div class="flex items-center text-xs text-muted overflow-hidden">
    <div
      class="shrink-0 mr-2 grid"
      :style="{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gap: `${gap}px`,
        width: `${size * dotSize + (size - 1) * gap}px`,
        height: `${size * dotSize + (size - 1) * gap}px`,
      }"
    >
      <span
        v-for="i in totalDots"
        :key="i"
        class="rounded-[0.5px] bg-current transition-opacity duration-100"
        :class="activeDots.has(i - 1) ? 'opacity-100' : 'opacity-20'"
        :style="{ width: `${dotSize}px`, height: `${dotSize}px` }"
      />
    </div>

    <UChatShimmer :text="displayedText" class="font-mono tracking-tight" />
  </div>
</template>
