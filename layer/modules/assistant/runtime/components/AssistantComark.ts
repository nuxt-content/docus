import { defineMarkdownComponent } from '@comark/vue'
import rangi from '@comark/vue/plugins/rangi'
import { github } from 'rangi/themes'

export default defineMarkdownComponent({
  name: 'AssistantComark',
  plugins: [
    rangi({ theme: github }),
  ],
  class: '*:first:mt-0 *:last:mb-0',
})
