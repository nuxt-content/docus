<template>
  <div class="flex flex-col items-center justify-center h-screen gap-4">
    <h1 class="text-2xl font-bold">
      Custom Landing Page
    </h1>
    <UButton
      to="/getting-started/introduction"
      label="Navigate to docs"
    >
      Introduction
    </UButton>
  </div>
</template>

<script setup lang="ts">
console.log('index.vue loaded')
</script>
