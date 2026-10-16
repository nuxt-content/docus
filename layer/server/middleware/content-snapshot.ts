// Content v4: the server `$fetch`es its own snapshot, which only exists on the CDN on serverless.
// Answer it from server assets, otherwise v4's handler waits on itself.
export default defineEventHandler(async (event) => {
  if (import.meta.prerender) return

  const match = event.path.match(/^\/__nuxt_content\/(snapshot|manifest)\/([\w-]+)\.json$/)
  if (!match) return

  const artifact = await useStorage('assets:content-snapshots').getItem(`${match[1]}/${match[2]}.json`)
  if (artifact) return artifact
})
