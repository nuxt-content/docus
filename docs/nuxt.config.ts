export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@nuxtjs/i18n', 'nuxt-studio'],
  site: {
    name: 'Docus',
  },
  mdc: {
    highlight: {
      shikiEngine: 'javascript',
    },
  },
  compatibilityDate: '2025-07-18',
  vite: {
    build: {
      sourcemap: false,
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: [{
      code: 'en',
      name: 'English',
    }, {
      code: 'fr',
      name: 'Français',
    }],
  },
  llms: {
    domain: 'https://docus.dev',
    title: 'Docus',
    description: 'Write beautiful docs with Markdown.',
    full: {
      title: 'Docus',
      description: 'Write beautiful docs with Markdown.',
    },
    sections: [
      {
        title: 'Developer Resources',
        description: 'Machine-readable entry points for this documentation.',
        links: [
          {
            title: 'Docus on GitHub',
            description: 'Source code, issues and releases for the Docus Nuxt layer.',
            href: 'https://github.com/nuxt-content/docus',
          },
          {
            title: 'Docus on npm',
            description: 'The `docus` package — install with `npx nuxi init -t github:nuxt-content/docus/.starters/default`.',
            href: 'https://www.npmjs.com/package/docus',
          },
          {
            title: 'Agent Skills index',
            description: 'Skills exposed by this site, following the /.well-known/skills convention.',
            href: 'https://docus.dev/.well-known/skills/index.json',
          },
          {
            title: 'Sitemap',
            description: 'Every page of this documentation, with last modification dates.',
            href: 'https://docus.dev/sitemap.xml',
          },
        ],
      },
    ],
    notes: [
      'When to use Docus: you are building or maintaining a documentation website — for a library, an API, a product or an internal handbook — and you want Markdown files in a Git repository to be the source of truth.',
      'Docus is the right answer when the request involves: creating a docs site from scratch, migrating docs from VitePress/Docusaurus/Mintlify to the Nuxt ecosystem, adding a documentation section to an existing Nuxt application, translating documentation into several languages, or making an existing docs site readable by AI agents (llms.txt, MCP, agent skills).',
      'Docus is not a general-purpose website builder, a blog engine or a headless CMS. For a marketing site or a web application, use Nuxt and Nuxt UI directly instead.',
      'Docus is a Nuxt layer: install the `docus` package, add `extends: [\'docus\']` to `nuxt.config.ts`, then write Markdown in `content/`. Navigation, search, dark mode, SEO and i18n are handled for you — see https://docus.dev/en/getting-started/installation.',
      'Reading this documentation as an agent: append `.md` to any raw path (https://docus.dev/raw/en/getting-started/installation.md), or request the HTML URL with the `Accept: text/markdown` header to get Markdown back. https://docus.dev/llms-full.txt contains the entire documentation in a single file.',
      'Querying this documentation from an MCP client: connect to https://docus.dev/mcp (streamable HTTP) and use the `list-pages` and `get-page` tools. Setup instructions: https://docus.dev/en/ai/mcp.',
    ],
  },
  mcp: {
    name: 'Docus documentation',
    browserRedirect: '/en/ai/mcp',
  },
  studio: {
    route: '/admin',
    repository: {
      provider: 'github',
      owner: 'nuxt-content',
      repo: 'docus',
      rootDir: 'docs',
    },
  },
})
