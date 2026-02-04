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
        console.log('[Docus] Starting markdown redirect route generation')
        const vcJSON = resolve(nitro.options.output.dir, 'config.json')
        const vcConfig = JSON.parse(await readFile(vcJSON, 'utf8'))

        // Check if llms.txt exists before setting up any routes
        let llmsTxt
        const llmsTxtPath = resolve(nitro.options.output.publicDir, 'llms.txt')
        try {
          llmsTxt = await readFile(llmsTxtPath, 'utf-8')
          console.log('[Docus] Found llms.txt at:', llmsTxtPath)
        }
        catch {
          console.warn('[Docus] llms.txt not found, skipping markdown redirect routes')
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
        console.log('[Docus] Added root path redirects to /llms.txt')

        // Check if i18n is enabled
        const isI18nEnabled = !!(nuxt.options.i18n && nuxt.options.i18n.locales)
        let localeCodes: string[] = []

        if (isI18nEnabled) {
          // Get locale codes
          const locales = nuxt.options.i18n.locales || []
          localeCodes = locales.map((locale) => {
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
          console.log(`[Docus] Added locale homepage redirects for: ${localeCodes.join(', ')}`)
        }

        // Parse llms.txt to get all documentation pages
        const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
        const matches = [...llmsTxt.matchAll(urlRegex)]
        console.log(`[Docus] Found ${matches.length} URLs in llms.txt`)

        let processedCount = 0
        const sampleRoutes = []

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
            const newRoutes = [
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
            routes.push(...newRoutes)
            processedCount++

            // Collect first 3 routes as samples
            if (sampleRoutes.length < 3) {
              sampleRoutes.push({ pagePath, rawPath })
            }
          }
          catch {
            // Skip invalid URLs
          }
        }

        console.log(`[Docus] Generated ${processedCount} page redirects (${processedCount * 2} routes total)`)
        if (sampleRoutes.length > 0) {
          console.log('[Docus] Sample routes:')
          sampleRoutes.forEach(({ pagePath, rawPath }) => {
            console.log(`  ${pagePath} → ${rawPath}`)
          })
        }

        console.log(`[Docus] Adding ${routes.length} total routes to Vercel config`)
        vcConfig.routes.unshift(...routes)

        console.log('[Docus] vcJSON', JSON.stringify(vcConfig, null, 2))

        await writeFile(vcJSON, JSON.stringify(vcConfig, null, 2), 'utf8')
        console.log(`[Docus] Successfully wrote ${routes.length} routes to ${vcJSON}`)
      })
    })
  },
})
