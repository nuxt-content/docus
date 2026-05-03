/**
 * Assets Browser API
 * يجلب قائمة الملفات من خادم assets.alazab.com ويُعيدها كـ JSON منظّم.
 *
 * يدعم خادم nginx مع تفعيل autoindex بصيغة JSON:
 *   autoindex on;
 *   autoindex_format json;
 *
 * استخدام: GET /api/assets-browser?path=/
 */

export interface AssetEntry {
  name: string
  type: 'file' | 'directory'
  mtime: string
  size: number | null
  url: string
  ext: string
}

export interface AssetsBrowserResponse {
  ok: boolean
  path: string
  baseUrl: string
  entries: AssetEntry[]
  error?: string
}

const ASSETS_BASE_URL = 'https://assets.alazab.com'

/** Allowed path segments — prevent path traversal */
function sanitizePath(raw: string): string {
  // Decode once, strip null bytes, collapse multiple slashes
  const decoded = decodeURIComponent(raw || '/').replace(/\0/g, '').replace(/\/+/g, '/')
  // Reject any attempt at path traversal
  if (decoded.includes('..')) return '/'
  // Must start with /
  return decoded.startsWith('/') ? decoded : `/${decoded}`
}

function extOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''
}

/** Parse nginx JSON autoindex response */
function parseNginxJson(data: unknown[], path: string): AssetEntry[] {
  return data.map((item) => {
    const entry = item as { name: string, type: string, mtime: string, size: number }
    const isDir = entry.type === 'directory'
    const name = entry.name
    const url = `${ASSETS_BASE_URL}${path}${path.endsWith('/') ? '' : '/'}${name}`
    return {
      name,
      type: isDir ? 'directory' : 'file',
      mtime: entry.mtime || '',
      size: isDir ? null : (entry.size ?? null),
      url,
      ext: isDir ? '' : extOf(name),
    } as AssetEntry
  })
}

/** Parse nginx HTML autoindex response as fallback */
function parseNginxHtml(html: string, path: string): AssetEntry[] {
  const entries: AssetEntry[] = []
  // Extract all href values from anchor tags in the nginx directory listing
  const hrefRe = /<a\s+href="([^"]+)"/gi
  let m: RegExpExecArray | null
  while ((m = hrefRe.exec(html)) !== null) {
    const href = m[1]
    if (!href) continue
    // Skip parent link, absolute URLs, and mismatched absolute paths
    if (href === '../' || href.startsWith('http') || (href.startsWith('/') && !href.startsWith(path))) continue
    const name = decodeURIComponent(href.replace(/\/$/, ''))
    if (!name || name === '..') continue
    const isDir = href.endsWith('/')
    const url = `${ASSETS_BASE_URL}${path}${path.endsWith('/') ? '' : '/'}${href}`
    entries.push({
      name,
      type: isDir ? 'directory' : 'file',
      mtime: '',
      size: null,
      url,
      ext: isDir ? '' : extOf(name),
    })
  }
  return entries
}

export default defineEventHandler(async (event): Promise<AssetsBrowserResponse> => {
  const query = getQuery(event)
  const rawPath = (query.path as string) || '/'
  const path = sanitizePath(rawPath)

  const fetchUrl = `${ASSETS_BASE_URL}${path}`

  try {
    // Try JSON autoindex first
    const jsonRes = await $fetch<unknown[]>(fetchUrl, {
      headers: { Accept: 'application/json' },
      timeout: 8000,
      ignoreResponseError: true,
    }).catch(() => null)

    if (Array.isArray(jsonRes)) {
      return {
        ok: true,
        path,
        baseUrl: ASSETS_BASE_URL,
        entries: parseNginxJson(jsonRes, path),
      }
    }

    // Fallback: fetch HTML and parse
    const htmlRes = await $fetch<string>(fetchUrl, {
      headers: { Accept: 'text/html' },
      responseType: 'text',
      timeout: 8000,
    })

    return {
      ok: true,
      path,
      baseUrl: ASSETS_BASE_URL,
      entries: parseNginxHtml(htmlRes, path),
    }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      path,
      baseUrl: ASSETS_BASE_URL,
      entries: [],
      error: message,
    }
  }
})
