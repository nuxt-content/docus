[![docus](https://docus.dev/_og/s/c_Landing,title_Write+beautiful+docs+with+Markdown,description_Ship+fast+flexible+and+SEO-optimized+documentation+with+beautiful+design+out+of+the+box.,p_Ii9lbiI.png)](https://docus.dev)

> Create beautiful docs with Markdown & Vue components

[![npm version](https://img.shields.io/npm/v/docus.svg?style=flat&colorA=020420&colorB=EEEEEE)](https://npmjs.com/package/docus)
[![npm downloads](https://img.shields.io/npm/dm/docus.svg?style=flat&colorA=020420&colorB=EEEEEE)](https://npm.chart.dev/docus)
[![License](https://img.shields.io/npm/l/docus.svg?style=flat&colorA=020420&colorB=EEEEEE)](https://npmjs.com/package/docus)

## 🚀 Quick Start

### Local Development

Create a new documentation project in seconds:

```bash
# Create a new project
npx create-docus my-docs

# Or create with i18n template for multi-language docs
npx create-docus my-docs -t i18n

# Navigate to your project
cd my-docs

# Start development server
npm run dev
```

That's it! Your documentation site will be running at `http://localhost:3000`

### Online Development

Start by deploying the docus template and create your git repository directly from Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?demo-description=Markdown-based%20documentation%20starter%20with%20Nuxt%20and%20Vue%20components.&demo-image=%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2F5rLcegeMuG3ggDNfQt7rj9%2F040036056f7b30d2c99dc8998dc6b132%2Fdocus.png&demo-title=Docus&demo-url=https%3A%2F%2Fdocus.dev%2F&from=templates&project-name=Docus&repository-name=docus&repository-url=https%3A%2F%2Fgithub.com%2Fnuxt-content%2Fdocus%2Ftree%2Fmain%2F.starters%2Fdefault&skippable-integrations=1&teamSlug=vercel)

## 🎯 What it creates

The CLI scaffolds a complete documentation project with:

- ✨ **Beautiful Design** - Clean, modern documentation theme built on Nuxt UI 4 & Tailwind CSS 4
- 📱 **Responsive** - Mobile-first responsive design
- 🌙 **Dark Mode** - Built-in dark/light mode with `d` shortcut toggle
- 🌍 **Internationalization** - Native i18n support with 20+ locales for assistant UI
- 🔍 **Search** - Client-side search with optional FTS5 full-text search backend
- 📝 **Markdown Enhanced** - Extended markdown with custom MDC components
- 🎨 **Customizable** - Theme variants, custom icons, 
- ⚡ **Fast** - Optimized for performance with Nuxt 4
- 🔧 **TypeScript** - Full TypeScript support
- 🤖 **AI Assistant** - Drop-in chat that answers questions from your docs, cites sources, and generates code
- 🔌 **Native MCP Server** - Built-in Model Context Protocol server for AI tool integration (Cursor, VS Code, Claude, etc.)
- 📚 **Agent Skills Discovery** - Publish skills from your docs site via `.well-known/skills/`
- 📄 **LLM-Ready** - Automatic `llms.txt` and `llms-full.txt` generation
- 🗺️ **SEO Optimized** - Sitemap, robots.txt, and OG image generation out of the box

Learn more on the [Docus documentation](https://docus.dev).

## 🤖 AI features

Docus ships with a full AI stack to help both your users and contributors:

### Assistant

Embed an AI-powered chat in your docs that answers questions, cites sources, and generates code examples. Powered by Vercel AI Gateway and your own MCP server. See the [Assistant guide](https://docus.dev/en/ai/assistant).

### MCP Server

Every Docus site exposes an MCP server at `/mcp` — install it directly into your editor to query your docs from any AI tool:

[![Install MCP in Cursor](https://docus.dev/mcp/badge.svg)](https://docus.dev/mcp/deeplink)
[![Install MCP in VS Code](https://docus.dev/mcp/badge.svg?ide=vscode)](https://docus.dev/mcp/deeplink?ide=vscode)

### Agent Skills

Drop skills into a `skills/` directory and Docus serves them at `/.well-known/skills/` following the [Cloudflare Agent Skills Discovery RFC](https://github.com/cloudflare/agent-skills-discovery-rfc). Users install them with a single command:

```bash
npx skills add https://your-docs-domain.com
```

Get the Docus skill itself to supercharge your AI assistant when building docs:

```bash
npx skills add nuxt-content/docus
```

## 📁 Project Structure

### Generated project

```
my-docs/
├── content/              # Your markdown content
│   ├── index.md         # Homepage
│   └── docs/            # Documentation pages
├── public/              # Static assets
└── package.json         # Dependencies and scripts
```

### Optional files and folders

Docus uses a layer system, you can go further and use any feature or file of a classical Nuxt project:

```
my-docs/
├── app.config.ts        # App configuration
├── nuxt.config.ts       # Nuxt configuration (add extra modules, components, etc.)
├── app/                 # App directory
│   ├── components/      # Components (add your own components)
│   ├── layouts/         # Layouts (add your own layouts)
│   └── pages/           # Pages (add your own pages)
└── server/              # Server-side code (add your own server-side code)
```

### `/content` folder structure

**Single language structure:**
```
content/
├── index.md
├── getting-started.md
└── guide/
    ├── introduction.md
    └── configuration.md
```

**Multi-language structure (with i18n):**
```
content/
├── en/
│   ├── index.md
│   └── guide/
│       └── introduction.md
└── fr/
    ├── index.md
    └── guide/
        └── introduction.md
```

## ⚡ Built with

Your project comes pre-configured with the best of the Nuxt ecosystem:

- [Nuxt 4](https://nuxt.com) - The web framework
- [Nuxt Content](https://content.nuxt.com/) - File-based CMS
- [Nuxt UI 4](https://ui.nuxt.com) - UI components
- [Nuxt Image](https://image.nuxt.com/) - Optimized images
- [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS
- [Docus Layer](https://www.npmjs.com/package/docus) - Documentation theme
- [Nuxt i18n](https://i18n.nuxtjs.org/) - Internationalization
- [Nuxt LLMs](https://github.com/nuxt-modules/llms) - `llms.txt` generation
- [Nuxt OG Image](https://nuxtseo.com/og-image) - Open Graph image generation
- [MCP Toolkit](https://mcp-toolkit.nuxt.dev) - Native MCP server
- [Vercel AI SDK](https://sdk.vercel.ai) - AI assistant (optional)

## 📖 Documentation

For detailed documentation on customizing your Docus project, visit the [Docus Documentation](https://docus.dev)

## 🛠️ Development

This repository contains the CLI tool source code.

### Local Development

To contribute to the CLI tool:

```bash
# Clone this repository
git clone https://github.com/nuxt-content/docus

# Install dependencies
pnpm install

# Run the dev server to run the docus docs
pnpm run dev
```

### Package Structure

This is a monorepo containing:

- [**`/cli`**](https://github.com/nuxt-content/docus/tree/main/cli) - CLI tool (`create-docus`)
- [**`/layer`**](https://github.com/nuxt-content/docus/tree/main/layer) - Docus Nuxt layer (`docus`)
- [**`/docs`**](https://github.com/nuxt-content/docus/tree/main/docs) - Official documentation
- [**`/.starters`**](https://github.com/nuxt-content/docus/tree/main/.starters) - Starters project

## 📄 License

Published under the [MIT](LICENSE) license.

---

Docus has been entirely rewritten from scratch and is inspired from [undocs](https://github.com/unjs/undocs) made by [@pi0](https://github.com/pi0) 💚
