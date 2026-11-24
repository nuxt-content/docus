import type { ContentFile } from 'comark-content'
import type { z } from 'zod'
import type { docsSchema } from '../../utils/schema'
import type { FaqQuestions, LocalizedFaqQuestions } from '../../modules/assistant/runtime/types'

export type { FaqCategory, FaqQuestions, LocalizedFaqQuestions } from '../../modules/assistant/runtime/types'

/**
 * A page of the `docs` content source, docs and landing pages alike.
 * `meta.title` and `meta.description` are the leading h1 and paragraph.
 */
export type DocsPage = ContentFile<z.infer<typeof docsSchema>, { title?: string, description?: string, toc?: { links: DocsTocLink[] } }>

/** A heading in `meta.toc`, from Comark's `toc` plugin. */
export interface DocsTocLink {
  id: string
  text: string
  depth: number
  children?: DocsTocLink[]
}

/**
 * An organization behind the site, emitted as a JSON-LD `Organization` node.
 */
export interface DocusSeoOrganization {
  name: string
  url?: string
  logo?: string
  /** Profile URLs (GitHub, X, LinkedIn…). */
  sameAs?: string[]
  /** Postal address, as a schema.org `PostalAddress`. */
  address?: Record<string, unknown>
  /** Ways to reach the organization, as schema.org `ContactPoint` nodes. */
  contactPoint?: Record<string, unknown> | Record<string, unknown>[]
}

declare module '@nuxt/schema' {
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
       * JSON-LD identity of the site
       * Allows agents and search engines to understand what the site is about
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
         * Publisher of the site, emitted as a linked `Organization`.
         *
         * Set `parentOrganization` when the publisher belongs to a larger
         * company: both are emitted and linked, so `publisher` keeps pointing
         * at a single entity.
         */
        organization?: DocusSeoOrganization & {
          parentOrganization?: DocusSeoOrganization
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
    navigation?: {
      /**
       * Sub-navigation for multi-section docs: `header` adds a tab bar below the header, `aside` adds section anchors at the top of the sidebar.
       */
      sub?: 'header' | 'aside'
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
       * @deprecated Search always runs SQLite FTS5 in a web worker. Setting it logs a warning.
       */
      fts?: boolean
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
