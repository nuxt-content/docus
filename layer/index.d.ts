import type { AssistantModuleOptions } from './modules/assistant'

export interface DocusNuxtConfig {
  assistant?: AssistantModuleOptions
  /** @deprecated Use `agentDiscovery.skills` instead */
  skills?: { dir?: string }
  /** @deprecated Use `agentDiscovery.errors` instead */
  notFound?: boolean
}

declare module '@nuxt/schema' {
  interface NuxtConfig {
    docus?: DocusNuxtConfig
    /** @deprecated Use `docus.assistant` instead */
    assistant?: AssistantModuleOptions
  }
  interface NuxtOptions {
    docus?: DocusNuxtConfig
    /** @deprecated Use `docus.assistant` instead */
    assistant?: AssistantModuleOptions
  }
}

declare module 'nuxt/schema' {
  interface NuxtConfig {
    docus?: DocusNuxtConfig
    /** @deprecated Use `docus.assistant` instead */
    assistant?: AssistantModuleOptions
  }
  interface NuxtOptions {
    docus?: DocusNuxtConfig
    /** @deprecated Use `docus.assistant` instead */
    assistant?: AssistantModuleOptions
  }
}
