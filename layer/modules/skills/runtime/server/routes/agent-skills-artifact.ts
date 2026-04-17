const WELL_KNOWN_PREFIX = '/.well-known/agent-skills/'

const CONTENT_TYPES: Record<string, string> = {
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
}

function getContentType(path: string): string {
  if (path.endsWith('.tar.gz')) return 'application/gzip'

  const ext = path.slice(path.lastIndexOf('.'))
  return CONTENT_TYPES[ext] || 'application/octet-stream'
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  if (!url.pathname.startsWith(WELL_KNOWN_PREFIX)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const artifactPath = decodeURIComponent(url.pathname.slice(WELL_KNOWN_PREFIX.length))
  if (!artifactPath || artifactPath.split('/').includes('..')) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request' })
  }

  const { skills } = useRuntimeConfig(event)
  const allowedArtifacts = new Set(
    skills.catalog.map((skill: { url: string }) => skill.url.slice(WELL_KNOWN_PREFIX.length)),
  )

  if (!allowedArtifacts.has(artifactPath)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  setResponseHeader(event, 'content-type', getContentType(artifactPath))
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')
  setResponseHeader(event, 'access-control-allow-origin', '*')

  const storage = useStorage('assets:agent-skills')
  const content = await storage.getItemRaw<Buffer | string>(artifactPath)

  if (content == null) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  return content
})
