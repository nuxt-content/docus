<script lang="ts" setup>
const props = withDefaults(defineProps<{ title?: string, description?: string }>(), {
  title: 'title',
  description: 'description',
})

const appConfig = useAppConfig()
const logoPath = appConfig.header?.logo?.dark || appConfig.header?.logo?.light

const logoSvg = await fetchLogoSvg(logoPath)

const title = (props.title || '').slice(0, 60)
const description = (props.description || '').slice(0, 200)

async function fetchLogoSvg(path?: string): Promise<string> {
  if (!path) return ''
  try {
    // eslint-disable-next-line
    // @ts-ignore
    const { url: siteUrl } = useSiteConfig()
    const url = path.startsWith('http') ? path : `${siteUrl}${path}`
    const svg = await $fetch<string>(url, { responseType: 'text' })
    return svg.replace('<svg', '<svg width="100%" height="100%"')
  }
  catch {
    return ''
  }
}
</script>

<template>
  <div class="w-full h-full flex items-center justify-center bg-neutral-900">
    <svg
      class="absolute right-0 top-0 opacity-50"
      width="629"
      height="593"
      viewBox="0 0 629 593"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_f_199_94966)">
        <path
          d="M628.5 -578L639.334 -94.4223L806.598 -548.281L659.827 -87.387L965.396 -462.344L676.925 -74.0787L1087.69 -329.501L688.776 -55.9396L1160.22 -164.149L694.095 -34.9354L1175.13 15.7948L692.306 -13.3422L1130.8 190.83L683.602 6.50012L1032.04 341.989L668.927 22.4412L889.557 452.891L649.872 32.7537L718.78 511.519L628.5 36.32L538.22 511.519L607.128 32.7537L367.443 452.891L588.073 22.4412L224.955 341.989L573.398 6.50012L126.198 190.83L564.694 -13.3422L81.8734 15.7948L562.905 -34.9354L96.7839 -164.149L568.224 -55.9396L169.314 -329.501L580.075 -74.0787L291.604 -462.344L597.173 -87.387L450.402 -548.281L617.666 -94.4223L628.5 -578Z"
          fill="white"
        />
      </g>
      <defs>
        <filter
          id="filter0_f_199_94966"
          x="0.873535"
          y="-659"
          width="1255.25"
          height="1251.52"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood
            flood-opacity="0"
            result="BackgroundImageFix"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="40.5"
            result="effect1_foregroundBlur_199_94966"
          />
        </filter>
      </defs>
    </svg>

    <div
      class="flex flex-col items-center justify-center p-8"
    >
      <div
        v-if="logoSvg"
        class="flex items-center justify-center mb-10 max-w-[900px]"
        style="width: 72px; height: 72px;"
        v-html="logoSvg"
      />
      <h1
        v-if="title"
        class="m-0 text-5xl font-semibold mb-4 text-white text-center"
      >
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="text-center text-2xl text-neutral-300 leading-tight max-w-[800px]"
      >
        {{ description }}
      </p>
    </div>
  </div>
</template>
