export default defineNuxtConfig({
  site: {
    url: 'https://docus.dev',
  },
  docus: {
    assistant: {
      enabled: Boolean(process.env.MISTRAL_API_KEY),
      apiPath: '/api/assistant',
    },
  },
})
