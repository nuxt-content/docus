---
name: docus-playground
description: Build and customize documentation sites with Docus. Use when creating docs pages, configuring navigation, theming, or setting up a Docus project.
metadata:
  author: docus
  version: "1.0"
---

# Docus Playground

## Overview

Docus is a documentation theme built on Nuxt Content. It provides a complete documentation experience with search, dark mode, and AI assistant support.

## Getting Started

Create a new Docus project:

```bash
npx create-docus@latest my-docs
```

## Configuration

Configure your site in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  extends: ['docus'],
})
```

## Writing Content

Place your documentation files in the `content/docs/` directory as Markdown files. Docus supports MDC syntax for rich content.

For more details, see [references/configuration.md](references/configuration.md).
