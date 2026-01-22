export function safeLocaleCode(locale: string): string {
  return locale.replaceAll('-', '_')
}