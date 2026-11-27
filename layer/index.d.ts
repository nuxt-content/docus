// Pulls in the AppConfig augmentation for consumers (module augmentations need an import)
import type {} from './app/types'
import type { AssistantModuleOptions } from './modules/assistant'

export interface DocusNuxtConfig {
  /**
   * How Docus serves content. `prerender` prerenders every page and runs search in the browser.
   * @default 'prerender'
   */
  mode?: 'prerender'
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
