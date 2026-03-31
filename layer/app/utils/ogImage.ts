// nuxt-og-image caps the encoded URL segment at 200 chars.
// Fixed overhead (component name, param keys, path encoding) is ~50 chars,
// leaving a ~150-char budget for title + description combined.
const OG_BUDGET = 150

/**
 * Trims description to fit within the nuxt-og-image 200-char URL segment limit,
 * accounting for the title length and trying to cut at the last sentence boundary.
 */
export function formatOgDescription(title: string | undefined, description: string | undefined): string | undefined {
  if (!description) return undefined

  const titleLen = Math.min(title?.length ?? 0, 60)
  const maxLen = OG_BUDGET - titleLen
  if (maxLen <= 0) return undefined

  const cleaned = description.replace(/,/g, '')
  if (cleaned.length <= maxLen) return cleaned

  const truncated = cleaned.slice(0, maxLen)
  const lastDot = truncated.lastIndexOf('.')
  return lastDot > 0 ? truncated.slice(0, lastDot + 1) : truncated
}
