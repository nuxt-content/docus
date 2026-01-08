import { withoutBase, withBase } from 'ufo'
import type { NitroApp } from 'nitropack/types'
import { defineNitroPlugin } from '#imports'

export default defineNitroPlugin((nitroApp: NitroApp) => {
  // @ts-expect-error - typecheck does not detect llms:generate
  nitroApp.hooks.hook('llms:generate', async (_, options) => {
    for (const section of options.sections) {
      if (section.contentCollection !== 'docs' && !section.contentCollection?.startsWith('docs')) {
        continue
      }

      for (const link of section.links) {
        link.href = withBase(`/raw${withoutBase(link.href, options.domain)}.md`, options.domain)
      }
    }
  })
})
