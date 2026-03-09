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
  const url = getRequestURL(event)
  const prefix = '/.well-known/skills/'
  const idx = url.pathname.indexOf(prefix)
  if (idx === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const filePath = decodeURIComponent(url.pathname.slice(idx + prefix.length))

  if (!filePath || filePath.includes('..')) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request' })
  }

  const storage = useStorage('assets:skills')
  const content = await storage.getItemRaw<string>(filePath)

  if (!content) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  setResponseHeader(event, 'content-type', getContentType(filePath))
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')

  return content
})
