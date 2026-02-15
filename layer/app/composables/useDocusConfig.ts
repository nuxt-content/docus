export function useDocusConfig() {
  const config = useRuntimeConfig().public.docus as { basePath?: string, isEmbedded?: boolean } | undefined
  return {
    basePath: config?.basePath || '/',
    isEmbedded: config?.isEmbedded || false,
  }
}
