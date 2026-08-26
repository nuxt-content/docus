import { getRequestHeader } from 'h3'
import type { H3Event } from 'h3'

/** Cap on echoed values: the path is attacker-controlled and an agent reads the body. */
const MAX_ECHO_LENGTH = 200

/** Compared after dropping the `: /path` suffix Nitro appends in development. */
const GENERIC_MESSAGES = new Set(['', 'not found', 'page not found'])

function accepts(event: H3Event, type: string): boolean {
  const header = getRequestHeader(event, 'accept')
  return !!header && header.toLowerCase().includes(type)
}

function readHeader(event: H3Event, name: string): string {
  return (getRequestHeader(event, name) || '').toLowerCase()
}

function pathname(event: H3Event): string {
  return (event.path || '/').split('?')[0] || '/'
}

/** Nitro strips the base from `event.path`; restore it so the body agrees with its links. */
export function requestPath(event: H3Event, baseURL = '/'): string {
  return `${baseURL.replace(/\/$/, '')}${pathname(event)}`
}

/** Browsers keep the theme's error page. */
export function wantsHtml(event: H3Event): boolean {
  return accepts(event, 'text/html')
}

/**
 * API clients keep the default JSON body.
 */
export function wantsJson(event: H3Event): boolean {
  if (accepts(event, 'application/json')) return true
  if (readHeader(event, 'sec-fetch-mode') === 'cors' && readHeader(event, 'sec-fetch-dest') === 'empty') {
    return true
  }

  const path = pathname(event)
  return path.startsWith('/api/') || path.endsWith('.json')
}

/**
 * Only page-ish requests get a document: a missing script, image or feed is
 * consumed by code, and markdown would be nonsense there. `.md` stays in,
 * since a raw markdown URL is exactly what an agent asks for.
 */
export function wantsAsset(event: H3Event): boolean {
  const extension = pathname(event).split('/').pop()?.match(/\.([a-z0-9]+)$/i)?.[1]
  return !!extension && !['md', 'html', 'htm'].includes(extension.toLowerCase())
}

/** Drop what would break out of the surrounding code span, then cap the length. */
function escapeEcho(value: string): string {
  let cleaned = ''
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    if (code < 0x20 || code === 0x7F || char === '`') continue
    cleaned += char
  }
  cleaned = cleaned.trim()
  return cleaned.length > MAX_ECHO_LENGTH ? `${cleaned.slice(0, MAX_ECHO_LENGTH)}…` : cleaned
}

/** A route's own 404 message ("No article with that slug") says more than the path missing. */
export function specificMessage(message?: string): string | undefined {
  const value = escapeEcho(message || '')
  if (!value) return undefined
  const normalized = value.toLowerCase().replace(/:.*$/, '').trim()
  return GENERIC_MESSAGES.has(normalized) ? undefined : value
}

export interface NotFoundLink {
  /** Root-relative path, without `app.baseURL`. */
  path: string
  description: string
}

export interface NotFoundMarkdownOptions {
  /** Requested path, already base-prefixed. */
  path: string
  /** `app.baseURL`, so links resolve on sub-path deployments. */
  baseURL?: string
  /** Resources this site actually serves, resolved at build time. */
  links?: NotFoundLink[]
  /** The error's own message, when it says more than "404". */
  message?: string
}

export function buildNotFoundMarkdown(options: NotFoundMarkdownOptions): string {
  const base = (options.baseURL || '/').replace(/\/$/, '')

  const lines = [
    '# 404 — Page not found',
    '',
    `\`${escapeEcho(options.path)}\` was not found on this site.`,
  ]

  const message = specificMessage(options.message)
  if (message) {
    lines.push('', `> ${message}`)
  }

  const links = options.links || []
  if (links.length) {
    lines.push('', '## Where to look next', '')
    for (const link of links) {
      lines.push(`- [${base}${link.path}](${base}${link.path}): ${link.description}`)
    }
  }

  return `${lines.join('\n')}\n`
}
