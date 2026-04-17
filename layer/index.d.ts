import type { AssistantModuleOptions } from './modules/assistant'
import type { SkillsModuleOptions } from './modules/skills'

export interface DocusNuxtConfig {
  assistant?: AssistantModuleOptions
  skills?: SkillsModuleOptions
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
