import { defineNuxtModule } from '@nuxt/kit'
import { resolve } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'

export default defineNuxtModule({
  meta: {
    name: 'markdown-rewrite',
  },
  setup(_options, nuxt) {
    nuxt.hooks.hook('nitro:init', (nitro) => {
      if (nitro.options.dev || !nitro.options.preset.includes('vercel')) {
        return
      }

      nitro.hooks.hook('compiled', async () => {
        const vcJSON = resolve(nitro.options.output.dir, 'config.json')
        const vcConfig = JSON.parse(await readFile(vcJSON, 'utf8'))

        // Always redirect / to /llms.txt
        const routes = [
          {
            src: '^/$',
            dest: '/llms.txt',
            has: [{ type: 'header', key: 'accept', value: '(.*)text/markdown(.*)' }],
          },
          {
            src: '^/$',
            dest: '/llms.txt',
            has: [{ type: 'header', key: 'user-agent', value: 'curl/.*' }],
          },
        ]

        // Check if i18n is enabled and add locale-specific routes
        const isI18nEnabled = !!(nuxt.options.i18n && nuxt.options.i18n.locales)

        if (isI18nEnabled) {
          // Get locale codes
          const locales = nuxt.options.i18n.locales || []
          const localeCodes = locales.map((locale) => {
            return typeof locale === 'string' ? locale : locale.code
          })

          // Create a regex pattern for all locales (e.g., "en|fr|es")
          const localePattern = localeCodes.join('|')

          // Add routes for each locale: /{locale} → /llms.txt
          routes.push(
            {
              src: `^/(${localePattern})$`,
              dest: '/llms.txt',
              has: [{ type: 'header', key: 'accept', value: '(.*)text/markdown(.*)' }],
            },
            {
              src: `^/(${localePattern})$`,
              dest: '/llms.txt',
              has: [{ type: 'header', key: 'user-agent', value: 'curl/.*' }],
            },
          )
        }

        vcConfig.routes.unshift(...routes)

        await writeFile(vcJSON, JSON.stringify(vcConfig, null, 2), 'utf8')
      })
    })
  },
})
