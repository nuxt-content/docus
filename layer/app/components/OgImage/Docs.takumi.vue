<script lang="ts" setup>
const { title, description, headline } = defineProps<{ title?: string, description?: string, headline?: string }>()

const appConfig = useAppConfig()
const { name: siteName } = useSiteConfig()
const primaryColor = appConfig.ui?.colors?.primary ?? 'emerald'
</script>

<template>
  <div class="w-full h-full flex flex-col justify-between bg-neutral-950 px-[80px] py-[60px]">
    <!-- Radial glow top-right: wide soft layer -->
    <div class="absolute top-0 right-0 w-[700px] h-[700px] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.04)_40%,transparent_70%)]" />
    <!-- Radial glow top-right: tight bright core -->
    <div class="absolute top-0 right-0 w-[350px] h-[350px] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.08)_35%,transparent_65%)]" />

    <div class="flex-1 flex flex-col justify-center">
      <p
        v-if="headline"
        :class="`uppercase text-[22px] font-bold m-0 mb-5 tracking-[0.05em] text-${primaryColor}-500`"
      >
        {{ headline }}
      </p>
      <h1
        v-if="title"
        class="m-0 mb-6 text-[50px] font-bold text-white leading-[1.1] w-full max-w-[900px] wrap-break-word"
      >
        {{ title?.slice(0, 60) }}
      </h1>
      <p
        v-if="description"
        class="m-0 text-[28px] text-neutral-400 leading-[1.4] w-full max-w-[900px] wrap-break-word"
      >
        {{ description?.slice(0, 200) }}
      </p>
    </div>

    <div class="flex">
      <div class="text-white text-[18px] font-normal rounded-lg px-5 py-2">
        {{ siteName }}
      </div>
    </div>
  </div>
</template>
