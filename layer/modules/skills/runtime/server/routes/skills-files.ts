import { useLogger, createError } from 'evlog'

const CONTENT_TYPES: Record<string, string> = {
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.py': 'text/plain; charset=utf-8',
  '.sh': 'text/plain; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
}

function getContentType(path: string): string {
  const ext = path.slice(path.lastIndexOf('.'))
  return CONTENT_TYPES[ext] || 'application/octet-stream'
}

export default defineEventHandler(async (event) => {
  const log = useLogger(event)
  const url = getRequestURL(event)
  const prefix = '/.well-known/skills/'
  const idx = url.pathname.indexOf(prefix)
  if (idx === -1) {
    throw createError({
      message: 'Not Found',
      status: 404,
      why: `Request path "${url.pathname}" does not contain "${prefix}"`,
    })
  }

  const filePath = decodeURIComponent(url.pathname.slice(idx + prefix.length))

  if (!filePath || filePath.includes('..')) {
    log.warn(`Skills: rejected suspicious path "${filePath}"`)
    throw createError({
      message: 'Bad Request',
      status: 400,
      why: 'Path traversal attempts (..) are not allowed',
    })
  }

  const { skills } = useRuntimeConfig(event)
  const skillName = filePath.split('/')[0]

  log.set({ skills: { name: skillName, file: filePath } })

  if (!skills.catalog.some((s: { name: string }) => s.name === skillName)) {
    throw createError({
      message: 'Not Found',
      status: 404,
      why: `Skill "${skillName}" is not registered in the catalog`,
      fix: 'Add a SKILL.md under the configured skills/ directory',
    })
  }

  const storage = useStorage('assets:skills')
  const content = await storage.getItemRaw<string>(filePath)

  if (!content) {
    throw createError({
      message: 'Not Found',
      status: 404,
      why: `File "${filePath}" is not bundled in the skills storage`,
      fix: 'Ensure the file exists in the skills directory and rebuild',
    })
  }

  log.set({ skills: { name: skillName, file: filePath, contentLength: content.length } })

  setResponseHeader(event, 'content-type', getContentType(filePath))
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')

  return content
})
