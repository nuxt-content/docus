[![docus](https://docus.dev/_og/s/c_Landing,title_Write+beautiful+docs+with+Markdown,description_Ship+fast+flexible+and+SEO-optimized+documentation+with+beautiful+design+out+of+the+box.+Docus+brings+together+the+best+of+the+Nuxt+ecosystem.+Powered+by+Nuxt+UI.,p_Ii9lbiI.png)](https://docus.dev)

> CLI tool to create beautiful docs with Markdown

[![npm version](https://img.shields.io/npm/v/create-docus.svg?style=flat&colorA=020420&colorB=EEEEEE)](https://npmjs.com/package/create-docus)
[![npm downloads](https://img.shields.io/npm/dm/create-docus.svg?style=flat&colorA=020420&colorB=EEEEEE)](https://npm.chart.dev/create-docus)
[![License](https://img.shields.io/npm/l/create-docus.svg?style=flat&colorA=020420&colorB=EEEEEE)](https://npmjs.com/package/create-docus)

The fastest way to create a new [Docus](https://docus.dev) documentation project. This CLI tool scaffolds a complete documentation website using the [`docus`](https://www.github.com/nuxt-content/docus/tree/main/layer) Nuxt layer.

## 🚀 Quick Start

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

## 🌍 Templates

### Default Template
Creates a basic documentation project ready for single-language content.

### I18n Template  
Use the `-t i18n` flag to create a project with internationalization support:

```bash
npx create-docus my-docs -t i18n
```

The i18n template includes:
- Pre-configured `@nuxtjs/i18n` module
- Locale-based content structure (`content/en/`, `content/fr/`)
- Built-in language switcher
- Automatic URL prefixing (`/en/docs`, `/fr/docs`)

## 🎯 What it creates

The CLI scaffolds a complete documentation project with:

- ✨ **Beautiful Design** - Clean, modern documentation theme
- 📱 **Responsive** - Mobile-first responsive design  
- 🌙 **Dark Mode** - Built-in dark/light mode support
- 🌍 **Internationalization** - Native i18n support for multi-language docs
- 🔍 **Search** - Full-text search functionality
- 📝 **Markdown Enhanced** - Extended markdown with custom components
- 🎨 **Customizable** - Easy theming and brand customization
- ⚡ **Fast** - Optimized for performance with Nuxt 4
- 🔧 **TypeScript** - Full TypeScript support

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
- [Nuxt UI](https://ui.nuxt.com) - UI components
- [Nuxt Image](https://image.nuxt.com/) - Optimized images
- [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS
- [Docus Layer](https://www.npmjs.com/package/docus) - Documentation theme

## 🔗 Related Packages

- [`docus`](https://github.com/nuxt-content/docus/tree/main/layer) - The Nuxt layer that powers your documentation

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

# Build the CLI
pnpm run build

# Run the dev server to run the docus docs
pnpm run dev
```

## 📄 License

Published under the [MIT](https://github.com/nuxt-content/docus/blob/main/LICENSE) license.
