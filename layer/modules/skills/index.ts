import { addPrerenderRoutes, addServerHandler, createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { defu } from 'defu'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { NitroConfig } from 'nitropack'
import { parse as parseYaml } from 'yaml'

interface SkillEntry {
  name: string
  description: string
  files: string[]
}

export interface SkillsModuleOptions {
  dir?: string
}

const SKILL_NAME_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
const MAX_NAME_LENGTH = 64

const log = logger.withTag('Docus')

const defaults: Required<SkillsModuleOptions> = {
  dir: 'skills',
}

export default defineNuxtModule<SkillsModuleOptions>({
  meta: {
    name: 'skills',
  },
  async setup(_inlineOptions, nuxt) {
    const options = defu(nuxt.options.docus?.skills, defaults) as Required<SkillsModuleOptions>

    const skillsDir = join(nuxt.options.rootDir, options.dir)
    if (!existsSync(skillsDir)) return

    const catalog = await scanSkills(skillsDir)
    if (!catalog.length) return

    log.info(`Found ${catalog.length} agent skill${catalog.length > 1 ? 's' : ''}: ${catalog.map(s => s.name).join(', ')}`)

    nuxt.options.runtimeConfig.skills = { catalog }

    const { resolve } = createResolver(import.meta.url)

    const onNitroConfig = nuxt.hook as (name: 'nitro:config', cb: (nitroConfig: NitroConfig) => void) => void
    onNitroConfig('nitro:config', (nitroConfig) => {
      nitroConfig.serverAssets ||= []
      nitroConfig.serverAssets.push({ baseName: 'skills', dir: skillsDir })
    })

    const prerenderRoutes = ['/.well-known/skills/index.json']
    for (const skill of catalog) {
      for (const file of skill.files) {
        prerenderRoutes.push(`/.well-known/skills/${skill.name}/${file}`)
      }
    }
    addPrerenderRoutes(prerenderRoutes)

    addServerHandler({
      route: '/.well-known/skills/index.json',
      handler: resolve('./runtime/server/routes/skills-index'),
    })

    addServerHandler({
      route: '/.well-known/skills/**',
      handler: resolve('./runtime/server/routes/skills-files'),
    })
  },
})

function parseFrontmatter(content: string): { name?: string, description?: string } | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match?.[1]) return null
  try {
    return parseYaml(match[1])
  }
  catch {
    return null
  }
}

function validateSkillName(name: string, dirName: string): boolean {
  if (name.length > MAX_NAME_LENGTH) {
    log.warn(`Skill "${name}" exceeds ${MAX_NAME_LENGTH} character limit`)
    return false
  }
  if (!SKILL_NAME_REGEX.test(name) || name.includes('--')) {
    log.warn(`Skill name "${name}" does not match the Agent Skills naming spec`)
    return false
  }
  if (name !== dirName) {
    log.warn(`Skill name "${name}" does not match directory name "${dirName}"`)
    return false
  }
  return true
}

async function listFilesRecursively(dir: string, base: string = ''): Promise<string[]> {
  const files: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursively(join(dir, entry.name), relPath))
    }
    else {
      files.push(relPath)
    }
  }
  return files
}

async function scanSkills(skillsDir: string): Promise<SkillEntry[]> {
  const catalog: SkillEntry[] = []
  const entries = await readdir(skillsDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const skillDir = join(skillsDir, entry.name)
    const skillMdPath = join(skillDir, 'SKILL.md')

    if (!existsSync(skillMdPath)) continue

    const content = await readFile(skillMdPath, 'utf-8')
    const frontmatter = parseFrontmatter(content)

    if (!frontmatter?.description) {
      log.warn(`Skipping skill "${entry.name}": missing description in SKILL.md frontmatter`)
      continue
    }

    const name = frontmatter.name || entry.name
    if (!validateSkillName(name, entry.name)) continue

    const allFiles = await listFilesRecursively(skillDir)
    const files = allFiles.filter(f => !f.split('/').some(s => s.startsWith('.')))
    const sortedFiles = ['SKILL.md', ...files.filter(f => f !== 'SKILL.md')]

    catalog.push({
      name,
      description: frontmatter.description,
      files: sortedFiles,
    })
  }

  return catalog
}

declare module 'nuxt/schema' {
  interface RuntimeConfig {
    skills: {
      catalog: SkillEntry[]
    }
  }
}
