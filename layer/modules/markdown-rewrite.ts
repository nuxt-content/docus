import { defineNuxtModule, logger } from '@nuxt/kit'
import { resolve } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'

const log = logger.withTag('Docus')

type I18nLocale = string | { code: string }
type DocusI18nOptions = { locales?: I18nLocale[] }

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

        // Check if llms.txt exists before setting up any routes
        let llmsTxt
        const llmsTxtPath = resolve(nitro.options.output.publicDir, 'llms.txt')
        try {
          llmsTxt = await readFile(llmsTxtPath, 'utf-8')
        }
        catch {
          log.warn('llms.txt not found, skipping markdown redirect routes')
          return
        }

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

        // Check if i18n is enabled
        const i18nOptions = (nuxt.options as typeof nuxt.options & { i18n?: DocusI18nOptions }).i18n
        const isI18nEnabled = !!i18nOptions?.locales
        let localeCodes: string[] = []

        if (isI18nEnabled) {
          // Get locale codes
          const locales = i18nOptions?.locales || []
          localeCodes = locales.map((locale: I18nLocale) => {
            return typeof locale === 'string' ? locale : locale.code
          })

          // Create a regex pattern for all locales (e.g., "en|fr|es")
          const localePattern = localeCodes.join('|')

          // Add routes for each locale homepage: /{locale} → /llms.txt
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

        // Parse llms.txt to get all documentation pages
        const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
        const matches = [...llmsTxt.matchAll(urlRegex)]

        for (const match of matches) {
          const url = match[2]
          if (!url) continue

          try {
            // Extract path from URL
            const urlObj = new URL(url)
            const rawPath = urlObj.pathname

            // Skip root path (already handled)
            if (rawPath === '/') continue

            // Only process raw markdown URLs from llms.txt
            if (!rawPath.startsWith('/raw/')) continue

            // Convert /raw/en/getting-started/installation.md to /en/getting-started/installation
            const pagePath = rawPath.replace('/raw', '').replace(/\.md$/, '')

            // Skip locale homepages (e.g., /en, /fr) - they already redirect to /llms.txt
            if (isI18nEnabled) {
              const isLocaleHomepage = localeCodes.some(code => pagePath === `/${code}`)
              if (isLocaleHomepage) continue
            }

            // Add redirect routes: page URL → raw markdown URL
            const docsRoutes = [
              {
                src: `^${pagePath}$`,
                dest: rawPath,
                has: [{ type: 'header', key: 'accept', value: '(.*)text/markdown(.*)' }],
              },
              {
                src: `^${pagePath}$`,
                dest: rawPath,
                has: [{ type: 'header', key: 'user-agent', value: 'curl/.*' }],
              },
            ]
            routes.push(...docsRoutes)
          }
          catch {
            // Skip invalid URLs
          }
        }

        vcConfig.routes.unshift(...routes)

        await writeFile(vcJSON, JSON.stringify(vcConfig, null, 2), 'utf8')
        log.info(`Successfully wrote ${routes.length} routes to ${vcJSON} (serve markdown content to AI agents)`)
      })
    })
  },
})
