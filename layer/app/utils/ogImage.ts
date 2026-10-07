// nuxt-og-image caps the encoded URL segment at 200 chars.
// Fixed overhead (component name, param keys, path encoding) is ~50 chars,
// leaving a ~150-char budget for title + description combined.
const OG_BUDGET = 150
const OG_TITLE_MAX = 60

/**
 * Nitro never prerenders a URL containing `..`, and zero-runtime OG images only exist when prerendered.
 * A trailing dot on the last param becomes `..png`, so dots are dropped at the end and runs become `…`.
 */
function withoutDotRuns(text: string): string {
  return text.replace(/\.{2,}/g, '…').replace(/\.+$/, '')
}

/**
 * Trims the title to fit the OG image and keeps its URL prerenderable.
 */
export function formatOgTitle(title: string | undefined): string | undefined {
  return title ? withoutDotRuns(title.slice(0, OG_TITLE_MAX)) : undefined
}

/**
 * Trims description to fit within the nuxt-og-image 200-char URL segment limit,
 * accounting for the title length and trying to cut at the last sentence boundary.
 */
export function formatOgDescription(title: string | undefined, description: string | undefined): string | undefined {
  if (!description) return undefined

  const titleLen = Math.min(title?.length ?? 0, OG_TITLE_MAX)
  const maxLen = OG_BUDGET - titleLen
  if (maxLen <= 0) return undefined

  const cleaned = withoutDotRuns(description)
  if (cleaned.length <= maxLen) return cleaned

  const truncated = cleaned.slice(0, maxLen)
  const lastDot = truncated.lastIndexOf('.')
  return withoutDotRuns(lastDot > 0 ? truncated.slice(0, lastDot) : truncated)
}
