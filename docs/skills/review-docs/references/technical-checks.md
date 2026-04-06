# Technical Validation Guidelines

Technical correctness checks for Docus documentation, focusing on MDC syntax, frontmatter structure, and component usage.

## Frontmatter Structure

### Required Fields

Every documentation page MUST have:

```yaml
---
title: Page Title
description: Page description
---
```

### Optional but Recommended Fields

```yaml
---
title: Page Title
description: Page description
navigation:
  icon: i-lucide-icon-name
  title: Custom Sidebar Label  # Optional override
seo:
  title: SEO-Optimized Title
  description: SEO-Optimized Description
links:
  - label: Related Link
    icon: i-lucide-link
    to: /path/to/page
---
```

### Field Validation Rules

**title:**
- Type: String
- Required: Yes
- Max length: 100 characters (recommended 60 for SEO)
- Must be unique across pages

**description:**
- Type: String
- Required: Yes
- Max length: 200 characters (recommended 160 for SEO)
- Should be concise and descriptive

**navigation.icon:**
- Type: String
- Format: `i-{collection}-{icon-name}` (e.g., `i-lucide-house`, `i-lucide-code-xml`)
- Must start with `i-`
- Lucide icons preferred for consistency

**navigation.title:**
- Type: String
- Optional: Overrides default sidebar title
- Keep short (1-3 words)

**seo.title:**
- Type: String
- Optimal: 50-60 characters
- Can differ from page title for SEO optimization

**seo.description:**
- Type: String
- Optimal: 120-160 characters
- More detailed than main description if needed

**links:**
- Type: Array of objects
- Each object requires: `label`, `to`
- Optional: `icon`, `target` (for external links)

### Common Frontmatter Errors

❌ **Missing required fields:**
```yaml
---
title: My Page
# ERROR: description is missing
---
```

❌ **Invalid icon format:**
```yaml
---
navigation:
  icon: lucide-house  # ERROR: must start with 'i-'
---
```

❌ **Invalid links structure:**
```yaml
---
links:
  - "https://example.com"  # ERROR: must be object with label and to
---
```

✅ **Correct structure:**
```yaml
---
title: Installation
description: Learn how to install Docus in your project
navigation:
  icon: i-lucide-download
seo:
  title: Install Docus in Your Nuxt Project
  description: Step-by-step guide to installing and configuring Docus documentation theme.
links:
  - label: Quick Start
    icon: i-lucide-zap
    to: /getting-started/quick-start
---
```

## MDC Component Syntax

### Critical Rule: u- Prefix

**ALL Nuxt UI components in MDC MUST use the `u-` prefix.**

This is the most common error and causes build failures.

### Common Components Requiring u- Prefix

| Component | Incorrect | Correct |
|-----------|-----------|---------|
| Page Hero | `::page-hero` | `::u-page-hero` |
| Page Section | `::page-section` | `::u-page-section` |
| Page Grid | `::page-grid` | `::u-page-grid` |
| Page Card | `::page-card` | `::u-page-card` |
| Page Feature | `::page-feature` | `::u-page-feature` |
| Button | `::button` or `:::button` | `:::u-button` |
| Badge | `::badge` | `::u-badge` |
| Color Mode Image | `:color-mode-image` | `:u-color-mode-image` |

### Component Nesting Levels

MDC uses colons to indicate nesting depth:

```markdown
::u-page-hero           # Level 1: 2 colons
  :::u-button           # Level 2: 3 colons
    ::::div             # Level 3: 4 colons (HTML elements)
      :::::span         # Level 4: 5 colons
```

**Validation:** Ensure nesting levels are consistent and logical.

### Component Attributes

**Inline attributes** (use curly braces):

```markdown
:::u-button{color="neutral" size="xl" to="/path" trailing-icon="i-lucide-arrow-right"}
Button Text
:::
```

**Block attributes** (use --- separator):

```markdown
:::u-button
---
color: neutral
size: xl
to: /path
trailing-icon: i-lucide-arrow-right
---
Button Text
:::
```

**Common attribute errors:**

❌ Wrong: `:::u-button(color="neutral")`
✅ Correct: `:::u-button{color="neutral"}`

❌ Wrong: `:::u-button[size=xl]`
✅ Correct: `:::u-button{size="xl"}`

### Slot Syntax

Components with named slots use `#slot-name`:

```markdown
::u-page-hero
#title
Your Title Here

#description
Your description text

#links
  :::u-button{to="/start"}
  Get Started
  :::
::
```

**Validation:** Ensure slot names match component documentation.

### Content vs Nuxt Content Components

**Nuxt Content components** (no u- prefix):
- `::code-group` - Multi-tab code blocks
- `::steps` - Step-by-step instructions
- `::note`, `::tip`, `::warning`, `::caution` - Callouts

**Nuxt UI components** (require u- prefix):
- `::u-page-*` - Page layout components
- `::u-button`, `::u-badge` - Interactive elements
- `:u-color-mode-image` - Images with theme variants

### Code Block Validation

#### File Path Labels

**ALL code blocks should include file name labels**, not just config files. This applies to every code example that represents a file:

✅ Good:
````markdown
```vue [App.vue]
<script setup lang="ts">
import { ref } from 'vue'
</script>
```
````

````markdown
```typescript [parse.ts]
import { parse } from 'comark'
```
````

````markdown
```tsx [App.tsx]
export default function App() {}
```
````

❌ Missing label:
````markdown
```vue
<script setup lang="ts">
import { ref } from 'vue'
</script>
```
````

**Label naming conventions:**
- Vue components: `[App.vue]`, `[components/Alert.vue]`, `[pages/index.vue]`
- TypeScript files: `[parse.ts]`, `[config.ts]`, `[server.ts]`
- React components: `[App.tsx]`, `[components/Card.tsx]`
- Config files: `[nuxt.config.ts]`, `[app.config.ts]`
- CSS files: `[styles.css]`, `[app/assets/css/main.css]`
- Terminal commands: `[Terminal]`

**Exceptions** (no label needed):
- Type definitions / interfaces
- MDC syntax examples (` ```mdc `)
- Inline snippets that don't represent a file

#### Code Language Consistency

Code examples should match the project's language stack. Check the project's `tsconfig.json`, `package.json`, or existing code to determine the default language.

**For TypeScript projects**, all code examples should use TypeScript. Common mismatches to flag:
- Vue `<script setup>` missing `lang="ts"` → should be `<script setup lang="ts">`
- `.js` file extensions in examples when the project uses `.ts`
- Missing type annotations in function signatures when the project uses strict TypeScript

#### Language Tags

Always specify language for syntax highlighting:

✅ Good: ` ```ts `, ` ```bash `, ` ```vue `
❌ Avoid: ` ``` ` (no language)

#### Code Groups

Use `::code-group` for multi-variant examples (package managers, frameworks, etc.):

````markdown
::code-group
```bash [pnpm]
pnpm add docus
```

```bash [npm]
npm install docus
```

```bash [yarn]
yarn add docus
```

```bash [bun]
bun add docus
```
::
````

**Ensure all package managers the project/ecosystem supports are represented.** Check the project's README, `package.json` scripts, or lock files to determine which ones to include. Common omissions: forgetting newer package managers (e.g., bun) or removing one by mistake.

#### Code Groups: What NOT to Group

**Do NOT group a terminal command with a config file** — these are separate steps:

❌ Bad (mixing install + config in one group):
````markdown
::code-group
```bash [Terminal]
npm install my-package
```

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['my-package']
})
```
::
````

✅ Good (separate blocks with transition text):
````markdown
```bash [Terminal]
npm install my-package
```

Add the module to your `nuxt.config.ts`:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['my-package']
})
```
````

**When to use `::code-group`:**
- Package manager variants (pnpm/npm/yarn/bun)
- Framework variants (Vue/React)
- Code + Output pairs (`[Code]` / `[Output]`)
- Syntax + AST pairs (`[Syntax]` / `[AST]`)

#### Code Preview

Use `::code-preview` to show rendered output alongside source code. This is ideal for documenting visual features like markdown syntax, code block metadata, component rendering:

````markdown
::code-preview
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |

#code
```mdc
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
```
::
````

**When to use `::code-preview`:**
- Markdown syntax examples (headings, lists, tables, blockquotes, task lists, emojis)
- Code block features (filename labels, line highlighting)
- Any feature where seeing the rendered result adds clarity

**When NOT to use `::code-preview`:**
- API/TypeScript code examples (no visual preview)
- Component examples with unregistered custom components


## File and Directory Naming

### Directory Structure

Documentation sections should follow numbered pattern:

```
content/
├── en/
│   ├── index.md
│   ├── 1.getting-started/
│   ├── 2.guide/
│   ├── 3.api/
│   └── 4.advanced/
```

**Rules:**
- Directories start with number for ordering: `1.`, `2.`, `3.`
- Use kebab-case for directory names
- Name reflects section content

### File Naming

**Pattern:** `{number}.{name}.md`

Examples:
- `1.introduction.md`
- `2.installation.md`
- `3.configuration.md`

**Rules:**
- Start with number for ordering within section
- Use kebab-case (lowercase with hyphens)
- Descriptive name (not `page-1.md` or `doc.md`)

### Navigation Files

**Each section directory must have `.navigation.yml`:**

```yaml
# 1.getting-started/.navigation.yml
title: Getting Started
icon: i-lucide-rocket
```

**Purpose:** Controls sidebar display and section metadata.

## Common Technical Errors

### 1. Missing u- Prefix (Most Common)

**Error pattern:**
```markdown
::page-hero
#title
Welcome
::
```

**Fix:**
```markdown
::u-page-hero
#title
Welcome
::
```

### 2. Inconsistent Nesting

**Error pattern:**
```markdown
::u-page-section
::::u-button  # Wrong: skipped nesting level
Close
::::
::
```

**Fix:**
```markdown
::u-page-section
  :::u-button
  Close
  :::
::
```

### 3. Invalid Component Names

**Error pattern:**
```markdown
::u-hero  # Component doesn't exist
```

**Fix:**
```markdown
::u-page-hero  # Use correct component name
```

### 4. Missing File Labels in Code Blocks

**Error pattern:**
````markdown
```typescript
export default defineNuxtConfig({})
```
````

**Fix:**
````markdown
```ts [nuxt.config.ts]
export default defineNuxtConfig({})
```
````

### 5. Broken Component Attributes

**Error pattern:**
```markdown
:::u-button color=neutral size=xl
```

**Fix:**
```markdown
:::u-button{color="neutral" size="xl"}
```

## Validation Checklist

For each page, verify:

### Frontmatter
- [ ] `title` and `description` fields present
- [ ] `navigation.icon` starts with `i-` if present
- [ ] `links` array has correct object structure
- [ ] No invalid YAML syntax
- [ ] Use `navigation: false` for pages that should exist (e.g. index redirects) but not appear in sidebar

### MDC Components
- [ ] All Nuxt UI components use `u-` prefix
- [ ] Nesting levels are consistent (::, :::, ::::)
- [ ] Component names are valid
- [ ] Attributes use correct syntax `{key="value"}`
- [ ] Slot names match component docs
- [ ] `::code-preview` used for visually renderable examples (markdown syntax, tables, lists, etc.)

### Code Blocks
- [ ] Language tags specified (ts, js, vue, bash, etc.)
- [ ] File name labels on all code blocks representing files (not just config files)
- [ ] Code language matches the project's stack (e.g., `lang="ts"` on Vue `<script setup>` for TypeScript projects)
- [ ] Use `::code-group` for multi-variant examples (package managers, frameworks, etc.)
- [ ] Package manager `::code-group` covers all supported package managers (check against the project/ecosystem)
- [ ] Only group equivalent alternatives — don't mix unrelated steps (e.g., install + config) in a `::code-group`
- [ ] `::code-preview` used where rendered preview adds clarity

### File Structure
- [ ] Directory follows numbered pattern (`1.section/`)
- [ ] Files follow numbered pattern (`1.page.md`)
- [ ] `.navigation.yml` exists in each section
- [ ] File and directory names are kebab-case
