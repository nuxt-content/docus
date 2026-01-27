---
name: create-docs
description: |
  Create complete documentation sites for projects. Use when asked to:
  "create docs", "add documentation", "setup docs site", "generate docs",
  "document my project", "write docs", "initialize documentation",
  "add a docs folder", "create a docs website". Generates Docus-based sites
  with search, dark mode, MCP server, and llms.txt integration.
---

# Create Docs

Generate a complete, production-ready documentation site for any project.

## Workflow

1. **Analyze** - Detect package manager, monorepo structure, read context
2. **Initialize** - Create docs directory with correct setup
3. **Generate** - Write documentation pages using templates
4. **Configure** - Set up AI integration (MCP, llms.txt)
5. **Finalize** - Provide next steps with correct commands

---

## Package Manager Reference

Detect from lock files, default to npm if none found:

| Lock File | PM | Install | Run | Add |
|-----------|------|---------|-----|-----|
| `pnpm-lock.yaml` | pnpm | `pnpm install` | `pnpm run` | `pnpm add` |
| `package-lock.json` | npm | `npm install` | `npm run` | `npm install` |
| `yarn.lock` | yarn | `yarn install` | `yarn` | `yarn add` |
| `bun.lockb` | bun | `bun install` | `bun run` | `bun add` |

Use `[pm]` as placeholder in commands below.

---

## Step 1: Analyze Project

### Detect Project Structure

```
Check for:
├── pnpm-workspace.yaml   → pnpm monorepo
├── turbo.json            → Turborepo monorepo
├── lerna.json            → Lerna monorepo
├── nx.json               → Nx monorepo
├── apps/                 → Apps directory (monorepo)
├── packages/             → Packages directory (monorepo)
├── docs/                 → Existing docs (avoid overwriting)
├── README.md             → Main documentation source
└── src/ or lib/          → Source code location
```

### Determine Docs Location

| Project Type | Target Directory | Workspace Entry |
|--------------|------------------|-----------------|
| Standard project | `./docs` | N/A |
| Monorepo with `apps/` | `./apps/docs` | `apps/docs` |
| Monorepo with `packages/` | `./docs` | `docs` |
| Existing `docs/` folder | Ask user or `./documentation` | — |

### Read Context Files

| File | Extract |
|------|---------|
| `README.md` | Project name, description, features, usage examples |
| `package.json` | Name, description, dependencies, repository URL |
| `src/` or `lib/` | Exported functions, composables for API docs |

### Detect i18n Requirement

Check if project needs multi-language docs:

| Indicator | Action |
|-----------|--------|
| `@nuxtjs/i18n` in dependencies | Use i18n template |
| `locales/` or `i18n/` folder exists | Use i18n template |
| Multiple language README files | Use i18n template |
| User explicitly mentions multiple languages | Use i18n template |
| None of the above | Use default template |

---

## Step 2: Initialize Docs

### Create Directory Structure

**Default template:**

```
[docs-location]/
├── app/                            # Optional: for customization
│   ├── app.config.ts
│   ├── components/
│   ├── layouts/
│   └── pages/
├── content/
│   ├── index.md
│   └── 1.getting-started/
│       ├── .navigation.yml
│       └── 1.introduction.md
├── public/
│   └── favicon.ico
├── package.json
└── .gitignore
```

**i18n template** (if multi-language detected):

```
[docs-location]/
├── app/
│   └── app.config.ts
├── content/
│   ├── en/
│   │   ├── index.md
│   │   └── 1.getting-started/
│   │       ├── .navigation.yml
│   │       └── 1.introduction.md
│   └── fr/                         # Or other detected languages
│       ├── index.md
│       └── 1.getting-started/
│           ├── .navigation.yml
│           └── 1.introduction.md
├── nuxt.config.ts                  # Required for i18n config
├── public/
│   └── favicon.ico
├── package.json
└── .gitignore
```

### Create package.json

**Default:**

```json
{
  "name": "[project-name]-docs",
  "private": true,
  "scripts": {
    "dev": "nuxt dev --extends docus",
    "build": "nuxt build --extends docus",
    "generate": "nuxt generate --extends docus",
    "preview": "nuxt preview --extends docus"
  },
  "dependencies": {
    "docus": "latest",
    "better-sqlite3": "^12.5.0",
    "nuxt": "^4.2.2"
  }
}
```

**i18n** (add `@nuxtjs/i18n`):

```json
{
  "name": "[project-name]-docs",
  "private": true,
  "scripts": {
    "dev": "nuxt dev --extends docus",
    "build": "nuxt build --extends docus",
    "generate": "nuxt generate --extends docus",
    "preview": "nuxt preview --extends docus"
  },
  "dependencies": {
    "@nuxtjs/i18n": "^10.2.1",
    "docus": "latest",
    "better-sqlite3": "^12.5.0",
    "nuxt": "^4.2.2"
  }
}
```

### Create nuxt.config.ts (i18n only)

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [
      { code: 'en', language: 'en-US', name: 'English' },
      { code: 'fr', language: 'fr-FR', name: 'Français' }
    ],
    defaultLocale: 'en'
  }
})
```

### Create .gitignore

```
node_modules
.nuxt
.output
.data
dist
```

### Update Monorepo Configuration (if applicable)

#### pnpm Monorepo

1. Add docs to workspace and configure `onlyBuiltDependencies` (required for better-sqlite3):

```yaml [pnpm-workspace.yaml]
packages:
  - 'apps/*'
  - 'docs'

onlyBuiltDependencies:
  - better-sqlite3
```

2. Add dev script to root package.json:

```json [package.json]
{
  "scripts": {
    "docs:dev": "pnpm run --filter [docs-package-name] dev"
  }
}
```

Or with directory path:

```json [package.json]
{
  "scripts": {
    "docs:dev": "cd docs && pnpm dev"
  }
}
```

#### npm/yarn Monorepo

```json [package.json]
{
  "workspaces": ["apps/*", "docs"],
  "scripts": {
    "docs:dev": "npm run dev --workspace=docs"
  }
}
```

---

## Step 3: Generate Documentation

Use templates from [references/templates.md](references/templates.md).

**CRITICAL: MDC Component Naming**

All Nuxt UI components in MDC must use the `u-` prefix:

| Correct | Wrong |
|---------|-------|
| `::u-page-hero` | `::page-hero` |
| `::u-page-section` | `::page-section` |
| `:::u-page-feature` | `:::page-feature` |
| `:::u-button` | `:::button` |
| `::::u-page-card` | `::::page-card` |

Without the `u-` prefix, Vue will fail to resolve the components.

### Documentation Structure

```
content/
├── index.md                        # Landing page
├── 1.getting-started/
│   ├── .navigation.yml
│   ├── 1.introduction.md
│   └── 2.installation.md
├── 2.guide/
│   ├── .navigation.yml
│   ├── 1.configuration.md
│   ├── 2.authentication.md
│   └── 3.deployment.md
└── 3.api/                          # If applicable
    ├── .navigation.yml
    └── 1.reference.md
```

### Generate Pages

1. **Landing page** (`index.md`) - Hero + features grid
2. **Introduction** - What & why, use cases
3. **Installation** - Prerequisites, install commands
4. **Guide pages** - Feature documentation with action-based H2 headings

For writing style, see [references/writing-guide.md](references/writing-guide.md).
For MDC components, see [references/mdc-components.md](references/mdc-components.md).

---

## Step 4: Configure AI Integration

Docus automatically includes MCP server (`/mcp`) and llms.txt generation. No configuration needed.

**Do NOT add AI Integration sections to the landing page.** These features work automatically.

Optionally mention in the introduction page:

```markdown
::note
This documentation includes AI integration with MCP server and automatic `llms.txt` generation.
::
```

### Optional: app.config.ts

```ts [app/app.config.ts]
export default defineAppConfig({
  docus: {
    name: '[Project Name]',
    description: '[Project description]',
    url: 'https://[docs-url]',
    socials: {
      github: '[org]/[repo]'
    }
  }
})
```

### Optional: Theme Customization

If the project has a design system or brand colors, customize the docs theme.

#### Custom CSS

Create `app/assets/css/main.css`:

```css [app/assets/css/main.css]
@import "tailwindcss";
@import "@nuxt/ui";

@theme static {
  /* Custom font */
  --font-sans: 'Inter', sans-serif;

  /* Custom container width */
  --ui-container: 90rem;

  /* Custom primary color (use project brand color) */
  --color-primary-50: oklch(0.97 0.02 250);
  --color-primary-500: oklch(0.55 0.2 250);
  --color-primary-900: oklch(0.25 0.1 250);
}
```

#### Extended app.config.ts

```ts [app/app.config.ts]
export default defineAppConfig({
  docus: {
    name: '[Project Name]',
    description: '[Project description]',
    url: 'https://[docs-url]',
    socials: {
      github: '[org]/[repo]',
      x: '@[handle]'
    }
  },
  // Customize UI components
  ui: {
    colors: {
      primary: 'emerald',
      neutral: 'zinc',
    },
    pageHero: {
      slots: {
        title: 'font-semibold sm:text-6xl'
      }
    }
  }
})
```

---

## Step 5: Finalize

Provide instructions using detected package manager.

### Standard Project

```
Documentation created in [docs-location]

To start:

  cd [docs-location]
  [pm] install
  [pm] run dev

Available at http://localhost:3000
```

### Monorepo

```
Documentation created in [docs-location]

To start from root:

  [pm] install
  [pm] run docs:dev

Or from docs directory:

  cd [docs-location]
  [pm] run dev

Available at http://localhost:3000
```

### Features Included

- Full-text search
- Dark mode
- MCP server for AI tools (/mcp)
- LLM integration (/llms.txt)
- SEO optimized

### Next Steps

1. Review generated content
2. Add more guides in `content/2.guide/`
3. Customize theme in `app.config.ts`
4. Deploy to Vercel/Netlify/Cloudflare

### Suggest Follow-ups

After documentation is created, suggest enhancements:

```
Your documentation is ready!

Would you like me to:
- **Customize the UI** - Match your brand colors and style
- **Enhance the landing page** - Add feature cards, code previews, visuals
- **Add i18n support** - Multi-language documentation
- **Set up deployment** - Deploy to Vercel, Netlify, or Cloudflare

Let me know what you'd like to improve!
```

---

## Deployment

| Platform | Command | Output |
|----------|---------|--------|
| Vercel | `npx vercel --prod` | Auto-detected |
| Netlify | `[pm] run generate` | `.output/public` |
| Cloudflare Pages | `[pm] run generate` | `.output/public` |
| GitHub Pages | `[pm] run generate` | `.output/public` |

---

## Example: auth-utils

**Detected:** pnpm monorepo, package in packages/

**Generated structure:**
```
docs/
├── content/
│   ├── index.md
│   ├── 1.getting-started/
│   │   ├── .navigation.yml
│   │   ├── 1.introduction.md
│   │   └── 2.installation.md
│   ├── 2.guide/
│   │   ├── .navigation.yml
│   │   ├── 1.authentication.md
│   │   ├── 2.oauth-providers.md
│   │   └── 3.sessions.md
│   └── 3.api/
│       ├── .navigation.yml
│       └── 1.composables.md
├── public/
│   └── favicon.ico
├── package.json
└── .gitignore
```

**Inside `authentication.md`** (action-based H2 headings):
```markdown
## Add basic authentication
## Protect your routes
## Handle login redirects
## Customize the session
```
