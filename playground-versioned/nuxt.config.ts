export default defineNuxtConfig({
  docus: {
    versions: {
      strategy: 'prefix',
      default: 'v4',
      items: [
        { label: 'Version 4', value: 'v4', tag: 'Latest' },
        { label: 'Version 3', value: 'v3' },
      ],
    },
  },
  i18n: false,
})
