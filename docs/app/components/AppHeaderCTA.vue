<template>
  <UButton
    v-if="/^\/(ar)?\/?$/.test($route.path)"
    to="/ar/about"
    color="neutral"
    size="sm"
    class="hidden lg:inline-flex"
  >
    من نحن
  </UButton>
</template>
