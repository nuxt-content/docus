/**
 * Alazab Enterprise Knowledge Base — server-side utility
 * Loads kb.corpus.json from Nitro server assets (baseName: 'alazab')
 * and exposes search, FAQ, routing, and brand-profile functions.
 */

export interface KBChunk {
  id: string
  document_id: string
  brand: string
  type: string
  title: string
  source_path: string
  text: string
}

export interface KBFAQ {
  id: string
  brand_id: string
  question: string
  answer: string
  tags?: string[]
}

export interface KBDocument {
  id: string
  brand: string
  type: string
  title: string
  source_path: string
}

export interface KBBrand {
  id: string
  name: string
  content?: string
  [key: string]: unknown
}

export interface AlazabKB {
  schema: string
  enterprise: Record<string, unknown>
  master: { id: string; title: string; content: string }
  brands: Record<string, KBBrand>
  faqs: KBFAQ[]
  routing_rules: unknown
  documents: KBDocument[]
  document_bodies: Record<string, string>
  chunks: KBChunk[]
  stats: Record<string, number>
  meta_whatsapp_public?: unknown
  audio_assets_manifest?: Array<{ brand: string; [key: string]: unknown }>
  security?: { sanitized_env_keys: string[] }
}

// In-memory cache — loaded once per server instance
let _kb: AlazabKB | null = null

export async function getKB(): Promise<AlazabKB> {
  if (!_kb) {
    _kb = await useStorage('assets:alazab').getItem<AlazabKB>('kb.corpus.json')
    if (!_kb) throw new Error('kb.corpus.json not found in server assets')
  }
  return _kb
}

// ─── Arabic-aware text normalization ────────────────────────────────────────

function normalizeArabic(input: string): string {
  return String(input || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s._:-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(input: string): string[] {
  const n = normalizeArabic(input)
  return Array.from(new Set((n.match(/[\p{L}\p{N}._:-]{2,}/gu) || [])))
}

function textMatchScore(query: string, text: string, brand?: string): number {
  const qn = normalizeArabic(query)
  const tn = normalizeArabic(text)
  if (!qn || !tn) return 0
  let score = 0
  if (tn.includes(qn)) score += 50
  for (const t of tokens(query)) {
    if (tn.includes(t)) score += t.length > 4 ? 8 : 4
  }
  if (brand && brand !== 'all') score += 1
  return score
}

function clip(text: string, query = '', radius = 520): string {
  const raw = String(text || '').replace(/\s+/g, ' ').trim()
  if (raw.length <= radius * 2) return raw
  const qTokens = tokens(query).filter(x => x.length > 3)
  const nraw = normalizeArabic(raw)
  let idx = -1
  for (const t of qTokens) { idx = nraw.indexOf(t); if (idx >= 0) break }
  if (idx < 0) return raw.slice(0, radius * 2) + '…'
  const start = Math.max(0, idx - radius)
  const end = Math.min(raw.length, idx + radius)
  return (start > 0 ? '…' : '') + raw.slice(start, end) + (end < raw.length ? '…' : '')
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface SearchResult {
  score: number
  id: string
  document_id: string
  brand: string
  type: string
  title: string
  source_path: string
  snippet: string
}

export function searchKB(
  kb: AlazabKB,
  query: string,
  brand = 'all',
  limit = 8,
): { query: string; brand: string; count: number; results: SearchResult[] } {
  const rows: SearchResult[] = []
  for (const c of kb.chunks || []) {
    if (brand !== 'all' && c.brand !== brand) continue
    const score = textMatchScore(query, [c.title, c.text, c.source_path, c.brand].join('\n'), brand)
    if (score > 0) {
      rows.push({
        score,
        id: c.id,
        document_id: c.document_id,
        brand: c.brand,
        type: c.type,
        title: c.title,
        source_path: c.source_path,
        snippet: clip(c.text, query),
      })
    }
  }
  rows.sort((a, b) => b.score - a.score || a.source_path.localeCompare(b.source_path))
  const results = rows.slice(0, Math.max(1, Math.min(20, limit)))
  return { query, brand, count: rows.length, results }
}

export function faqSearch(
  kb: AlazabKB,
  query: string,
  limit = 6,
): { query?: string; count: number; results: (KBFAQ & { score?: number })[] } {
  const cap = Math.max(1, Math.min(20, limit))
  if (!query) return { count: (kb.faqs || []).length, results: (kb.faqs || []).slice(0, cap) }
  const rows: (KBFAQ & { score: number })[] = []
  for (const f of kb.faqs || []) {
    const score = textMatchScore(query, `${f.question}\n${f.answer}`)
    if (score > 0) rows.push({ score, ...f })
  }
  rows.sort((a, b) => b.score - a.score)
  return { query, count: rows.length, results: rows.slice(0, cap) }
}

export function routeMessage(
  kb: AlazabKB,
  message: string,
): {
  message: string
  suggested_brand: string
  confidence: 'low' | 'medium' | 'high'
  scores: Record<string, number>
  evidence: SearchResult[]
  next_action: string
} {
  const brandScores: Record<string, number> = {}
  for (const key of Object.keys(kb.brands || {})) brandScores[key] = 0

  const results = searchKB(kb, message, 'all', 20).results
  for (const r of results) {
    if (brandScores[r.brand] !== undefined) brandScores[r.brand] += r.score
  }

  const routingRaw = JSON.stringify(kb.routing_rules || {})
  const rtScore = textMatchScore(message, routingRaw)
  if (rtScore) brandScores.enterprise = (brandScores.enterprise || 0) + rtScore

  const sorted = Object.entries(brandScores).sort((a, b) => b[1] - a[1])
  const [bestBrand, bestScore] = sorted[0] || ['enterprise', 0]

  return {
    message,
    suggested_brand: bestBrand,
    confidence: bestScore <= 0 ? 'low' : bestScore > 80 ? 'high' : 'medium',
    scores: Object.fromEntries(sorted),
    evidence: results.slice(0, 5),
    next_action:
      bestBrand === 'uberfix'
        ? 'اطلب بيانات طلب الصيانة: نوع العطل، الموقع، رقم الهاتف، صور إن وجدت، ورقم الطلب إن كان موجودًا.'
        : 'اجمع تفاصيل المشروع أو الخدمة ثم وجّه الطلب لفريق العلامة المختارة.',
  }
}

export function brandProfile(kb: AlazabKB, brand: string): KBBrand {
  const profile = kb.brands?.[brand]
  if (!profile) throw new Error(`brand not found: ${brand}`)
  return profile
}

export function contextPack(
  kb: AlazabKB,
  query: string,
  brand = 'all',
  limit = 8,
) {
  const search = searchKB(kb, query, brand, Math.max(1, Math.min(12, limit)))
  const faq = faqSearch(kb, query, 3).results
  const route = routeMessage(kb, query)
  return {
    query,
    route,
    search_results: search.results,
    faqs: faq,
    answer_rules: [
      'أجب من المعرفة المرفقة فقط.',
      'لو البيانات ناقصة اطلب البيانات التشغيلية المطلوبة بوضوح.',
      'لا تذكر أسعار نهائية إلا لو موجودة صراحة في السياق.',
      'وجّه الطلب للعلامة المناسبة داخل مجموعة العزب.',
    ],
  }
}
