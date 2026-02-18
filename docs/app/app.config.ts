export default defineAppConfig({
  header: {
    title: 'Docus',
    logo: {
      light: '/logo/logo-dark.svg',
      dark: '/logo/logo-light.svg',
      alt: 'Docus Logo',
      wordmark: {
        light: '/logo/wordmark-dark.svg',
        dark: '/logo/wordmark-light.svg',
      },
      favicon: '/favicon.svg',
    },
  },
  socials: {
    x: 'https://x.com/nuxt_js',
    discord: 'https://discord.com/invite/ps2h6QT',
    nuxt: 'https://nuxt.com',
  },
  github: {
    rootDir: 'docs',
  },
  assistant: {
    faqQuestions: {
      en: [
        { category: 'Getting Started', items: [
          'How do I install Docus?',
          'What is the project structure?',
          'How do I deploy my documentation?',
        ] },
        { category: 'Customization', items: [
          'How do I customize the theme?',
          'How do I add custom components?',
          'How do I configure internationalization?',
        ] },
        { category: 'AI Features', items: [
          'How do I enable the assistant?',
          'What is the MCP server?',
          'How do I generate llms.txt files?',
        ] },
      ],
      fr: [
        { category: 'Démarrage', items: [
          'Comment installer Docus ?',
          'Quelle est la structure du projet ?',
          'Comment déployer ma documentation ?',
        ] },
        { category: 'Personnalisation', items: [
          'Comment personnaliser le thème ?',
          'Comment ajouter des composants personnalisés ?',
          'Comment configurer l\'internationalisation ?',
        ] },
        { category: 'Fonctionnalités IA', items: [
          'Comment activer l\'assistant ?',
          'Qu\'est-ce que le serveur MCP ?',
          'Comment générer les fichiers llms.txt ?',
        ] },
      ],
    },
  },
  toc: {
    bottom: {
      links: [
        {
          icon: 'i-lucide-book-open',
          label: 'Nuxt UI docs',
          to: 'https://ui.nuxt.com/getting-started/installation/nuxt',
          target: '_blank',
        },
        {
          icon: 'i-lucide-book-open',
          label: 'Nuxt Content docs',
          to: 'https://content.nuxt.com/docs/getting-started/installation/',
          target: '_blank',
        },
        {
          icon: 'i-lucide-book-open',
          label: 'Nuxt Studio docs',
          to: 'https://nuxt.studio/introduction',
          target: '_blank',
        },
      ],
    },
  },
  ui: {
    pageHero: {
      slots: {
        title: 'font-semibold sm:text-6xl',
        container: '!pb-0',
      },
    },
    pageCard: {
      slots: {
        container: 'lg:flex min-w-0',
        wrapper: 'flex-none',
      },
    },
  },
})
