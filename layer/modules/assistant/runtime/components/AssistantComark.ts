import highlight from '@comark/nuxt/plugins/highlight'

// @ts-expect-error - defineComarkComponent is auto-imported by @comark/nuxt
export default defineComarkComponent({
  name: 'AssistantComark',
  plugins: [
    highlight(),
  ],
  class: '*:first:mt-0 *:last:mb-0',
})
