export default defineNuxtConfig({
  build: {
    analyze: {
      filename: '.nuxt/analyze/{name}.json',
      template: 'raw-data'
    }
  }
})
