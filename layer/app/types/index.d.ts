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
  }
}

export {}
