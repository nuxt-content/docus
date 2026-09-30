/**
 * Nuxt Content lowercases every path it generates, so an uppercase code would
 * never match its own pages. The original tag is kept as the locale `language`.
 */
export function normalizeLocale(code: string): string {
  return code.toLowerCase()
}

/**
 * Collection names must be valid identifiers, so hyphens become underscores.
 * `@nuxt/ui/locale` export names use the same form.
 */
export function getLocaleKey(code: string): string {
  return normalizeLocale(code).replace(/-/g, '_')
}

/** Locale files keep their BCP 47 name, so match them on the normalized code. */
export function findLocaleFile(code: string, fileNames: string[]): string | undefined {
  return fileNames.find(fileName => fileName.toLowerCase() === `${normalizeLocale(code)}.json`)
}

/** Lowercases the locale prefix of a path, or returns `undefined` when there is nothing to redirect. */
export function getLocaleRedirect(path: string, codes: string[]): string | undefined {
  const prefix = path.match(/^\/([^/?#]+)/)?.[1] || ''
  const code = normalizeLocale(prefix)

  return prefix !== code && codes.includes(code) ? `/${code}${path.slice(prefix.length + 1)}` : undefined
}
