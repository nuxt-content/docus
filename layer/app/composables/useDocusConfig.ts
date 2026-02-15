export function useDocusConfig() {
  const config = useRuntimeConfig().public.docus as Record<string, unknown> | undefined
  const basePath = (config?.basePath as string) || '/'
  return {
    basePath,
    isEmbedded: basePath !== '/',
  }
}
