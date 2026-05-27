import { defineComarkComponent } from '@comark/vue'
import highlight from '@comark/nuxt/plugins/highlight'

export default defineComarkComponent({
  name: 'AssistantComark',
  plugins: [
    highlight(),
  ],
  class: '*:first:mt-0 *:last:mb-0',
})
