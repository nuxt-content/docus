<script lang="ts" setup>
const props = defineProps<{ title?: string, description?: string }>()

const appConfig = useAppConfig()
const { name: siteName } = useSiteConfig()
const primaryColor = appConfig.ui?.colors?.primary ?? 'emerald'
const logoPath = appConfig.header?.logo?.dark || appConfig.header?.logo?.light

const logoSvg = await fetchLogoSvg(logoPath)

const title = props.title?.slice(0, 60)
const description = props.description?.slice(0, 200)

async function fetchLogoSvg(path?: string): Promise<string> {
  if (!path) return ''
  try {
    const { url: siteUrl } = useSiteConfig()
    const url = path.startsWith('http') ? path : `${siteUrl}${path}`
    const svg = await $fetch<string>(url, { responseType: 'text' })
    return svg.replace('<svg', '<svg width="48" height="48"')
  }
  catch {
    return ''
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-col justify-between bg-neutral-950 px-[80px] py-[60px]">
    <!-- Radial glow top-right: wide soft layer -->
    <div class="absolute top-0 right-0 w-[700px] h-[700px] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.04)_40%,transparent_70%)]" />
    <!-- Radial glow top-right: tight bright core -->
    <div class="absolute top-0 right-0 w-[350px] h-[350px] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.08)_35%,transparent_65%)]" />

    <div class="flex-1 flex flex-col justify-center w-full">
      <div
        v-if="logoSvg"
        class="flex justify-center mb-8"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          class="w-[48px] h-[48px]"
          v-html="logoSvg"
        />
      </div>
      <div
        v-if="title"
        class="flex justify-center mb-6"
      >
        <h1 class="m-0 text-[50px] font-bold text-white leading-[1.1] text-center wrap-break-word">
          {{ title }}
        </h1>
      </div>
      <div
        v-if="description"
        class="flex justify-center"
      >
        <p class="m-0 text-[28px] text-neutral-400 leading-[1.4] text-center wrap-break-word">
          {{ description }}
        </p>
      </div>
    </div>

    <div class="flex">
      <div :class="`text-[18px] font-medium rounded-lg px-5 py-2 text-${primaryColor}-500`">
        {{ siteName }}
      </div>
    </div>
  </div>
</template>
