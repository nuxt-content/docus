import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { addTemplate, addTypeTemplate, defineNuxtModule } from '@nuxt/kit'
import { parseFrontmatter } from '@comark/vue/parse'
import { defu } from 'defu'
import { resolveModulePath } from 'exsolve'
import { join } from 'pathe'
import { readPackageJSON } from 'pkg-types'
import { getLocaleKey, normalizeLocale } from '../utils/locale'
import { docsFolderExists, findLocaleFolder, landingPageExists } from '../utils/pages'

type I18nLocale = string | { code: string }

// Workarounds for Nuxt Content v4 regressions, each one a no-op on v3.
export default defineNuxtModule({
  meta: {
    name: 'content-v4',
  },
  async setup(_options, nuxt) {
    const contentPackage = await readPackageJSON(resolveModulePath('@nuxt/content', { from: import.meta.url }))
    const isContentV4 = contentPackage.version?.startsWith('4.') ?? false
    const rootDir = nuxt.options.rootDir

    // Always generated, so the runtime fallbacks resolve on v3 too.
    addTemplate({
      filename: 'docus/content-v4.mjs',
      getContents: () => [
        `export const navigationConfigs = ${JSON.stringify(isContentV4 ? readNavigationConfigs(rootDir, getLocales(nuxt.options)) : {})}`,
        `export const collectionDirs = ${JSON.stringify(isContentV4 ? getCollectionDirs(rootDir, getLocales(nuxt.options)) : {})}`,
      ].join('\n'),
    })
    addTypeTemplate({
      filename: 'types/docus-content-v4.d.ts',
      getContents: () => `declare module '#build/docus/content-v4.mjs' {
  export const navigationConfigs: Record<string, Record<string, unknown>>
  export const collectionDirs: Record<string, string>
}
`,
    })

    if (!isContentV4) return

    // Nuxt UI prose headings read the anchor config `@nuxtjs/mdc` used to set.
    const publicConfig = nuxt.options.runtimeConfig.public as Record<string, unknown>
    publicConfig.mdc = defu(publicConfig.mdc as Record<string, unknown>, {
      headings: { anchorLinks: { h1: false, h2: true, h3: true, h4: true, h5: false, h6: false } },
    })

    // Nuxt UI sets its highlight themes through `@nuxtjs/mdc` defaults, which v4 doesn't read.
    const content = nuxt.options as typeof nuxt.options & { content?: { build?: { markdown?: { highlight?: false | Record<string, unknown> } } } }
    const highlight = content.content?.build?.markdown?.highlight
    if (highlight && !highlight.theme) {
      highlight.theme = { light: 'material-theme-lighter', default: 'material-theme', dark: 'material-theme-palenight' }
    }

    // v3 registered `components/content/` globally without a path prefix, so `::my-component` resolves.
    nuxt.hook('components:dirs', (dirs) => {
      for (const layer of nuxt.options._layers) {
        const path = join(layer.config.srcDir, 'components/content')
        if (existsSync(path)) {
          dirs.unshift({ path, global: true, pathPrefix: false, prefix: '' })
        }
      }
    })

    // v4 re-exports every component eagerly for `ContentRenderer`, load them on demand instead.
    nuxt.hook('modules:done', () => {
      const template = nuxt.options.build.templates.find(template => template.filename === 'content/components.mjs')
      if (!template) return

      template.getContents = () => {
        const seen = new Set<string>()
        const lines = (nuxt.apps.default?.components ?? [])
          .filter((component) => {
            if (!component.filePath.endsWith('.vue') || seen.has(component.pascalName)) return false
            seen.add(component.pascalName)
            return true
          })
          .map((component) => {
            const pick = component.export === 'default' ? '' : `.then(m => m[${JSON.stringify(component.export)}])`
            return `export const ${component.pascalName} = /* #__PURE__ */ defineAsyncComponent(() => import(${JSON.stringify(component.filePath)})${pick})`
          })
        return [`import { defineAsyncComponent } from 'vue'`, ...lines].join('\n') + '\n'
      }
    })

    // The server `$fetch`es its own snapshot, see `server/middleware/content-snapshot.ts`.
    nuxt.hook('nitro:init', (nitro) => {
      nitro.options.serverAssets.push({ baseName: 'content-snapshots', dir: join(nitro.options.output.publicDir, '__nuxt_content') })
    })
  },
})

function getLocales(options: object): string[] {
  const locales = (options as { i18n?: { locales?: I18nLocale[] } }).i18n?.locales
  return Array.isArray(locales) ? locales.map(locale => normalizeLocale(typeof locale === 'string' ? locale : locale.code)) : []
}

/**
 * The content folder each collection reads, mirroring `content.config.ts`.
 * v4's `stem` is relative to it, v3's was relative to `content/`.
 */
function getCollectionDirs(rootDir: string, locales: string[]): Record<string, string> {
  if (!locales.length) {
    return { docs: docsFolderExists(rootDir) ? 'docs' : '', landing: '' }
  }

  const dirs: Record<string, string> = {}
  for (const code of locales) {
    const dir = findLocaleFolder(rootDir, code) || code
    const key = getLocaleKey(code)
    dirs[`docs_${key}`] = docsFolderExists(rootDir, dir) ? `${dir}/docs` : dir
    if (!landingPageExists(rootDir)) dirs[`landing_${key}`] = dir
  }
  return dirs
}

/**
 * `.navigation.yml` files keyed by the navigation path of their folder.
 * v4 doesn't parse YAML in v3 mode, so folder titles and icons are lost otherwise.
 */
function readNavigationConfigs(rootDir: string, locales: string[]): Record<string, Record<string, unknown>> {
  const contentDir = join(rootDir, 'content')
  if (!existsSync(contentDir)) return {}

  const configs: Record<string, Record<string, unknown>> = {}
  for (const file of readdirSync(contentDir, { recursive: true, encoding: 'utf8' })) {
    if (!/(?:^|\/)\.navigation\.ya?ml$/.test(file)) continue

    const segments = file.split('/').slice(0, -1)
    const path = '/' + segments
      .map((segment, index) => index === 0 && locales.includes(normalizeLocale(segment)) ? normalizeLocale(segment) : toPathSegment(segment))
      .join('/')
    configs[path] = parseFrontmatter(`---\n${readFileSync(join(contentDir, file), 'utf8')}\n---`).data as Record<string, unknown>
  }
  return configs
}

/** v3 `path-meta`: drop the `1.` ordering prefix, but keep versions like `1.x`. */
function toPathSegment(segment: string): string {
  return (/^\d+(?:\.\d+)*(?:\.x)?$/.test(segment) ? segment : segment.replace(/^\d+\./, '')).toLowerCase()
}
