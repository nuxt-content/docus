import { getToolName } from 'ai'
import type { ToolUIPart, DynamicToolUIPart } from 'ai'

export type AssistantToolPart = ToolUIPart | DynamicToolUIPart

type Translator = (key: string) => string

const VERB_KEYS: Record<string, [active: string, done: string]> = {
  list: ['searching', 'searched'],
  search: ['searching', 'searched'],
  find: ['searching', 'searched'],
  query: ['searching', 'searched'],
  get: ['reading', 'read'],
  read: ['reading', 'read'],
  fetch: ['reading', 'read'],
  show: ['finding', 'found'],
  open: ['opening', 'opened'],
  generate: ['generating', 'generated'],
  create: ['creating', 'created'],
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

function parseToolName(toolName: string): { verbKey?: [string, string], label: string } {
  const parts = toolName.split(/[-_\s]+/).filter(Boolean)
  const head = parts[0]?.toLowerCase()

  if (head && VERB_KEYS[head] && parts.length > 1) {
    return { verbKey: VERB_KEYS[head], label: parts.slice(1).join(' ') }
  }

  return { label: parts.join(' ') || toolName }
}

export function getToolText(part: AssistantToolPart, t: Translator): string {
  const done = part.state === 'output-available'
  const { verbKey, label } = parseToolName(getToolName(part))
  const key = verbKey ? verbKey[done ? 1 : 0] : (done ? 'searched' : 'searching')

  return `${t(`assistant.tools.${key}`)} ${label}`.trim()
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
