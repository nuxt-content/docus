import { defineNuxtModule, addTemplate, createResolver, logger } from '@nuxt/kit'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'pathe'
import { resolveModulePath } from 'exsolve'

const log = logger.withTag('docus')

export default defineNuxtModule({
  meta: {
    name: 'docus-css',
  },
  async setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)

    const contentDir = resolve(nuxt.options.rootDir, 'content')
    const uiPath = resolveModulePath('@nuxt/ui', { from: import.meta.url, conditions: ['style'] })
    const tailwindPath = resolveModulePath('tailwindcss', { from: import.meta.url, conditions: ['style'] })
    const layerDir = resolver.resolve('../app')
    const assistantDir = resolver.resolve('../modules/assistant')

    let userDocusPath: string | null = resolve(nuxt.options.srcDir, 'app.css')
    if (existsSync(userDocusPath)) {
      const userDocusCss = await readFile(userDocusPath, 'utf-8')
      if (userDocusCss.includes('@import "tailwindcss"')) {
        nuxt.hook('modules:done', () => {
          log.warn('`app.css` contains `@import "tailwindcss";` consider removing it to avoid duplicate css.')
        })
      }
    }
    else {
      userDocusPath = null
    }

    const cssTemplate = addTemplate({
      filename: 'docus.css',
      getContents: () => {
        return `@import ${JSON.stringify(tailwindPath)};
@import ${JSON.stringify(uiPath)};

@source "${contentDir.replace(/\\/g, '/')}/**/*";
@source "${layerDir.replace(/\\/g, '/')}/**/*";
@source "../../app.config.ts";
@source "${assistantDir.replace(/\\/g, '/')}/**/*";

html.dark .shiki span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}

:root {
  --ui-container: 90rem;
}
` + (userDocusPath ? `\n@import ${JSON.stringify(userDocusPath)};` : '')
      },
    })

    if (Array.isArray(nuxt.options.css)) {
      nuxt.options.css.unshift(cssTemplate.dst)
    }

    // Noisy Vite warnings
    const sourcemapWarnIgnore = ['@tailwindcss/vite:generate:build', 'nuxt:module-preload-polyfill']
    nuxt.hook('vite:extendConfig', (config) => {
      const logger = config.customLogger
      if (!logger) return
      const originalWarn = logger.warn.bind(logger)
      logger.warn = (msg, options) => {
        if (sourcemapWarnIgnore.some(p => msg.includes(p))) return
        originalWarn(msg, options)
      }
    })
  },
})
