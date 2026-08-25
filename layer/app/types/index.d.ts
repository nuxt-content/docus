import type { FaqQuestions, LocalizedFaqQuestions } from '../../modules/assistant/runtime/types'

export type { FaqCategory, FaqQuestions, LocalizedFaqQuestions } from '../../modules/assistant/runtime/types'

declare module 'nuxt/schema' {
  interface AppConfig {
    docus: {
      locale: string
      /**
       * Force a specific color mode. Leave empty for system preference with toggle.
       */
      colorMode?: '' | 'light' | 'dark'
      /**
       * Keyboard shortcuts configuration.
       */
      shortcuts?: {
        /**
         * Shortcut to toggle light and dark mode.
         * @default 'd'
         */
        toggleColorMode?: string
      }
    }
    seo: {
      titleTemplate: string
      title: string
      description: string
      /**
       * JSON-LD identity of the site, emitted on landing pages alongside the
       * `WebSite` schema. Lets agents and search engines tell what this site
       * is (a product, a company, a person) instead of guessing.
       */
      schema?: {
        /**
         * Schema.org type describing the site.
         * @default undefined (only `WebSite` is emitted)
         */
        type?: 'SoftwareApplication' | 'Product' | 'Organization' | 'Person'
        /**
         * Canonical profile URLs (GitHub, X, LinkedIn…), used as `sameAs`.
         */
        sameAs?: string[]
        /**
         * Category of the application, e.g. `DeveloperApplication`.
         * Only used with `SoftwareApplication`.
         */
        applicationCategory?: string
        /**
         * Platforms the application runs on, e.g. `Web`.
         * Only used with `SoftwareApplication`.
         */
        operatingSystem?: string
        /**
         * Price of the application. Set to `0` to advertise it as free.
         * Only used with `SoftwareApplication` and `Product`.
         */
        price?: number
        /**
         * Currency for `price`, as an ISO 4217 code.
         * @default 'USD'
         */
        priceCurrency?: string
        /**
         * Publisher of the site. Emitted as a linked `Organization`.
         */
        organization?: {
          name: string
          url?: string
          logo?: string
          sameAs?: string[]
        }
      }
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
    search: {
      /**
       * Use SQLite FTS5 full-text search instead of Fuse.js.
       * Requires @nuxt/content v3.14+.
       * @default false
       */
      fts: boolean
    }
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
