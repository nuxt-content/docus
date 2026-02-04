import { defineNuxtModule } from '@nuxt/kit'
import { resolve } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'

export default defineNuxtModule({
  meta: {
    name: 'markdown-rewrite',
  },
  setup(_options, nuxt) {
    nuxt.hooks.hook('nitro:init', (nitro) => {
      console.log('nitro', nitro.options.preset)
      if (nitro.options.dev || !nitro.options.preset.includes('vercel')) {
        return
      }

      nitro.hooks.hook('compiled', async () => {
        const vcJSON = resolve(nitro.options.output.dir, 'config.json')
        const vcConfig = JSON.parse(await readFile(vcJSON, 'utf8'))

        vcConfig.routes.unshift(
          // Redirect / to /llms.txt when Accept header contains text/markdown
          {
            src: '^/$',
            dest: '/llms.txt',
            has: [{ type: 'header', key: 'accept', value: '(.*)text/markdown(.*)' }],
          },
          // Redirect / to /llms.txt for curl user-agent requests
          {
            src: '^/$',
            dest: '/llms.txt',
            has: [{ type: 'header', key: 'user-agent', value: 'curl/.*' }],
          },
        )

        await writeFile(vcJSON, JSON.stringify(vcConfig, null, 2), 'utf8')
      })
    })
  },
})
