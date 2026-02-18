import type { FaqQuestions, LocalizedFaqQuestions } from '../../modules/assistant/runtime/types'

export type { FaqCategory, FaqQuestions, LocalizedFaqQuestions } from '../../modules/assistant/runtime/types'

declare module 'nuxt/schema' {
  interface AppConfig {
    docus: {
      locale: string
    }
    seo: {
      titleTemplate: string
      title: string
      description: string
    }
    header: {
      title: string
      logo: {
        light: string
        dark: string
        alt: string
        class?: string
        display?: 'logo' | 'wordmark'
        wordmark?: {
          light?: string
          dark?: string
        }
        favicon?: string
        brandAssetsUrl?: string
      }
    }
    socials: Record<string, string>
    toc: {
      title: string
      bottom: {
        title: string
        links: {
          icon: string
          label: string
          to: string
          target: string
        }[]
      }
    }
    github: {
      owner: string
      name: string
      url: string
      branch: string
      rootDir?: string
    } | false
    assistant?: {
      /**
       * Show the floating input at the bottom of documentation pages.
       * @default true
       */
      floatingInput?: boolean
      /**
       * Show the "Explain with AI" button in the documentation sidebar.
       * @default true
       */
      explainWithAi?: boolean
      /**
       * FAQ questions to display in the chat slideover.
       * Can be a simple array of strings, an array of categories, or a locale-based object.
       * @example Simple format: ['How to install?', 'How to configure?']
       * @example Category format: [{ category: 'Getting Started', items: ['How to install?'] }]
       * @example Localized format: { en: ['How to install?'], fr: ['Comment installer ?'] }
       */
      faqQuestions?: FaqQuestions | LocalizedFaqQuestions
      /**
       * Keyboard shortcuts configuration.
       */
      shortcuts?: {
        /**
         * Shortcut to focus the floating input.
         * @default 'meta_i'
         */
        focusInput?: string
      }
      /**
       * Icons configuration.
       */
      icons?: {
        /**
         * Icon for the assistant trigger button and slideover header.
         * @default 'i-lucide-sparkles'
         */
        trigger?: string
        /**
         * Icon for the "Explain with AI" button.
         * @default 'i-lucide-brain'
         */
        explain?: string
      }
    }
  }
}

export {}
