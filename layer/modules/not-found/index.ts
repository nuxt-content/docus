import { createResolver, defineNuxtModule } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import type { NitroConfig } from 'nitropack'
import type { NotFoundLink } from './runtime/server/utils/not-found'

type DocusLlmsOptions = { domain?: string, title?: string, full?: unknown }
type DocusSkillsRuntimeConfig = { catalog?: Array<{ name: string }> }

/**
 * Answer agent 404s with markdown instead of Nitro's JSON error body.
 *
 * Only the links this site actually serves are advertised.
 */
export default defineNuxtModule({
  meta: {
    name: 'not-found',
  },
  setup(_inlineOptions, nuxt) {
    if (nuxt.options.docus?.notFound === false) return

    const { resolve } = createResolver(import.meta.url)

    nuxt.hook('modules:done', () => {
      nuxt.options.runtimeConfig.notFound = { links: buildLinks(nuxt) }
    })

    const onNitroConfig = nuxt.hook as (name: 'nitro:config', cb: (nitroConfig: NitroConfig) => void) => void
    onNitroConfig('nitro:config', (nitroConfig) => {
      const existing = nitroConfig.errorHandler
      const handlers = Array.isArray(existing) ? existing : existing ? [existing] : []

      nitroConfig.errorHandler = [resolve('./runtime/server/utils/errors'), ...handlers]
    })
  },
})

function buildLinks(nuxt: Nuxt): NotFoundLink[] {
  const llms = nuxt.options.llms as DocusLlmsOptions | undefined
  const skills = nuxt.options.runtimeConfig.skills as DocusSkillsRuntimeConfig | undefined
  const title = llms?.title || 'this documentation'

  const links: NotFoundLink[] = []

  if (llms?.domain) {
    links.push({ path: '/llms.txt', description: `index of ${title}` })

    if (llms.full) {
      links.push({
        path: '/llms-full.txt',
        description: 'the full content of this site as a single markdown document',
      })
    }
  }

  links.push({ path: '/sitemap.xml', description: 'every page, with its last modification date' })

  if (skills?.catalog?.length) {
    links.push({
      path: '/.well-known/skills/index.json',
      description: 'agent skills published by this site',
    })
  }

  links.push({ path: '/', description: 'home page' })

  return links
}
