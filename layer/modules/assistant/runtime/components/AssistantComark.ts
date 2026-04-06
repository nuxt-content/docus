import highlight from '@comark/nuxt/plugins/highlight'
import SourceLink from './AssistantLink.vue'

export default defineComarkComponent({
  name: 'AssistantComark',
  plugins: [
    highlight(),
  ],
  components: {
    'source-link': SourceLink,
  },
  class: '*:first:mt-0 *:last:mb-0',
})
