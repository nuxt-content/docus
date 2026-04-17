import { addServerHandler, createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { create as createTar } from 'tar'
import { parse as parseYaml } from 'yaml'

type SkillArtifactType = 'skill-md' | 'archive'

interface SkillEntry {
  name: string
  type: SkillArtifactType
  description: string
  url: string
  digest: string
}

const SCHEMA_URI = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json'
const SKILL_NAME_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
const MAX_NAME_LENGTH = 64
const MAX_DESCRIPTION_LENGTH = 1024
const WELL_KNOWN_PREFIX = '/.well-known/agent-skills'

const log = logger.withTag('Docus')

export default defineNuxtModule({
  meta: {
    name: 'skills',
  },
  async setup(_options, nuxt) {
    const skillsDir = join(nuxt.options.rootDir, 'skills')
    if (!existsSync(skillsDir)) return

    const artifactsDir = join(nuxt.options.rootDir, '.data', 'docus-agent-skills')
    const catalog = await scanSkills(skillsDir, artifactsDir)
    if (!catalog.length) return

    log.info(`Found ${catalog.length} agent skill${catalog.length > 1 ? 's' : ''}: ${catalog.map(s => s.name).join(', ')}`)

    nuxt.options.runtimeConfig.skills = { schema: SCHEMA_URI, catalog }

    const { resolve } = createResolver(import.meta.url)

    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.serverAssets ||= []
      nitroConfig.serverAssets.push({ baseName: 'agent-skills', dir: artifactsDir })

      nitroConfig.prerender ||= {}
      nitroConfig.prerender.routes ||= []
      nitroConfig.prerender.routes.push(`${WELL_KNOWN_PREFIX}/index.json`)
      for (const skill of catalog) {
        nitroConfig.prerender.routes.push(skill.url)
      }
    })

    addServerHandler({
      route: `${WELL_KNOWN_PREFIX}/index.json`,
      handler: resolve('./runtime/server/routes/agent-skills-index'),
    })

    addServerHandler({
      route: `${WELL_KNOWN_PREFIX}/**`,
      handler: resolve('./runtime/server/routes/agent-skills-artifact'),
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

function validateDescription(description: string, name: string): boolean {
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    log.warn(`Skipping skill "${name}": description exceeds ${MAX_DESCRIPTION_LENGTH} character limit`)
    return false
  }
  return true
}

function digest(content: Buffer): string {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`
}

function sortSkillFiles(files: string[]): string[] {
  return ['SKILL.md', ...files.filter(file => file !== 'SKILL.md').sort()]
}

async function listFilesRecursively(dir: string, base: string = ''): Promise<string[]> {
  const files: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name
    if (entry.name.startsWith('.')) continue
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursively(join(dir, entry.name), relPath))
    }
    else if (entry.isFile()) {
      files.push(relPath)
    }
    else {
      log.warn(`Skipping unsupported skill file "${relPath}"`)
    }
  }
  return files
}

async function createSkillArtifact(skillDir: string, outputDir: string, name: string, files: string[]): Promise<Pick<SkillEntry, 'type' | 'url' | 'digest'>> {
  if (files.length === 1 && files[0] === 'SKILL.md') {
    const outputPath = join(outputDir, name, 'SKILL.md')
    await mkdir(join(outputDir, name), { recursive: true })
    const content = await readFile(join(skillDir, 'SKILL.md'))
    await writeFile(outputPath, content)

    return {
      type: 'skill-md',
      url: `${WELL_KNOWN_PREFIX}/${name}/SKILL.md`,
      digest: digest(await readFile(outputPath)),
    }
  }

  const outputPath = join(outputDir, `${name}.tar.gz`)
  await createTar({
    cwd: skillDir,
    file: outputPath,
    gzip: true,
    noMtime: true,
    portable: true,
  }, files)

  return {
    type: 'archive',
    url: `${WELL_KNOWN_PREFIX}/${name}.tar.gz`,
    digest: digest(await readFile(outputPath)),
  }
}

async function scanSkills(skillsDir: string, artifactsDir: string): Promise<SkillEntry[]> {
  const catalog: SkillEntry[] = []
  const entries = await readdir(skillsDir, { withFileTypes: true })
  await rm(artifactsDir, { recursive: true, force: true })
  await mkdir(artifactsDir, { recursive: true })

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
    if (!validateDescription(frontmatter.description, name)) continue

    const allFiles = await listFilesRecursively(skillDir)
    const sortedFiles = sortSkillFiles(allFiles)
    const artifact = await createSkillArtifact(skillDir, artifactsDir, name, sortedFiles)

    catalog.push({
      name,
      type: artifact.type,
      description: frontmatter.description,
      url: artifact.url,
      digest: artifact.digest,
    })
  }

  return catalog
}

declare module 'nuxt/schema' {
  interface RuntimeConfig {
    skills: {
      schema: string
      catalog: SkillEntry[]
    }
  }
}
