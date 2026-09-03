export default defineNitroPlugin((nitroApp) => {
  // The generated `/raw/index.md`, served when `/` is not a content document
  // (i18n sites, or a site with its own `index.vue`). Same description as
  // `llms.txt`, so the two agent entry points agree.
  nitroApp.hooks.hook('agent-discovery:index', (event, index) => {
    const llms = useRuntimeConfig(event).llms as { description?: string } | undefined

    index.description ||= llms?.description || useAppConfig(event).seo?.description
  })
})
