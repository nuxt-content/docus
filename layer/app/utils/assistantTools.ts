import { getToolName } from 'ai'
import type { ToolUIPart, DynamicToolUIPart } from 'ai'

export type AssistantToolPart = ToolUIPart | DynamicToolUIPart

const VERBS: Record<string, [active: string, done: string]> = {
  list: ['Searching', 'Searched'],
  search: ['Searching', 'Searched'],
  find: ['Searching', 'Searched'],
  query: ['Searching', 'Searched'],
  get: ['Reading', 'Read'],
  read: ['Reading', 'Read'],
  fetch: ['Reading', 'Read'],
  show: ['Finding', 'Found'],
  open: ['Opening', 'Opened'],
  generate: ['Generating', 'Generated'],
  create: ['Creating', 'Created'],
}

const SUFFIX_KEYS = [
  'search',
  'query',
  'q',
  'term',
  'path',
  'slug',
  'templateName',
  'componentName',
  'composableName',
  'name',
  'repo',
  'section',
  'id',
]

function parseToolName(toolName: string): { verb?: [string, string], label: string } {
  const parts = toolName.split(/[-_\s]+/).filter(Boolean)
  const head = parts[0]?.toLowerCase()

  if (head && VERBS[head] && parts.length > 1) {
    return { verb: VERBS[head], label: parts.slice(1).join(' ') }
  }

  return { label: parts.join(' ') || toolName }
}

export function getToolText(part: AssistantToolPart): string {
  const done = part.state === 'output-available'
  const { verb, label } = parseToolName(getToolName(part))

  if (verb) return `${done ? verb[1] : verb[0]} ${label}`

  return `${done ? 'Searched' : 'Searching'} ${label}`
}

export function getToolSuffix(part: AssistantToolPart): string | undefined {
  const input = (part.input || {}) as Record<string, unknown>

  for (const key of SUFFIX_KEYS) {
    const value = input[key]
    if (typeof value === 'string' && value.trim()) return value
  }

  return undefined
}

export function getToolIcon(part: AssistantToolPart): string {
  const name = getToolName(part).toLowerCase()

  if (/icon/.test(name)) return 'i-lucide-smile'
  if (/component/.test(name)) return 'i-lucide-box'
  if (/composable/.test(name)) return 'i-lucide-square-function'
  if (/template/.test(name)) return 'i-lucide-layout-template'
  if (/example|snippet/.test(name)) return 'i-lucide-code'
  if (/module|package/.test(name)) return 'i-lucide-box'
  if (/blog|post|news/.test(name)) return 'i-lucide-newspaper'
  if (/changelog|release/.test(name)) return 'i-lucide-history'
  if (/deploy|hosting|provider/.test(name)) return 'i-lucide-cloud'
  if (/getting.?started|guide/.test(name)) return 'i-lucide-rocket'
  if (/issue|github/.test(name)) return 'i-simple-icons-github'
  if (/page|doc/.test(name)) {
    const isList = /^(?:list|search|find|query)[-_]/.test(name)
    return isList ? 'i-lucide-book-open' : 'i-lucide-file-text'
  }

  return 'i-lucide-search'
}
