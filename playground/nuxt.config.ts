export default defineNuxtConfig({
  docus: {
    assistant: {
      enabled: Boolean(process.env.MISTRAL_API_KEY),
      apiPath: '/api/assistant',
    },
  },

  // Explicitly disable i18n for playground testing (enabled by .nuxtrc)
  i18n: false,
})
