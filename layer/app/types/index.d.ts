export interface FaqCategory {
  category: string
  items: string[]
}

export type FaqQuestions = string[] | FaqCategory[]
export type LocalizedFaqQuestions = Record<string, FaqQuestions>

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
    aiChat?: {
      title?: string
      placeholder?: string
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
    }
  }
}
