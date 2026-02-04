---
name: review-docs
description: |
  Review documentation for quality, clarity, SEO, and technical correctness.
  Optimized for Docus/Nuxt Content but works with any Markdown documentation.
  Use when asked to: "review docs", "check documentation", "audit docs",
  "validate documentation", "improve docs quality", "analyze documentation",
  "check my docs", "review my documentation pages", "validate MDC syntax",
  "check for SEO issues", "analyze doc structure".
  Provides actionable recommendations categorized by priority (Critical, Important, Nice-to-have).
---

# Review Docs

Comprehensive documentation review, optimized for Docus/Nuxt Content but compatible with any Markdown documentation.

## Workflow Overview

This skill performs a 5-step review process:

1. **Detect Project Type** - Identify Docus/Nuxt Content vs generic Markdown
2. **Analyze Structure** - Map documentation organization, locales, sections
3. **Technical Validation** - Check frontmatter, MDC syntax (if applicable), file naming
4. **Content Quality Review** - Evaluate clarity, SEO, structure, i18n
5. **Generate Report** - Provide categorized, actionable recommendations

### Priority Levels

- **Critical** - Blocks deployment or causes errors (missing frontmatter, invalid MDC syntax)
- **Important** - Significantly impacts UX/SEO (poor metadata, passive voice, unclear headings)
- **Nice-to-have** - Polish and optimization suggestions (add callouts, improve examples)

### Expectations

This skill generates a **detailed report only**. After reviewing, it offers to fix identified issues if requested.

---

## Step 1: Detect Project Type

**Goal:** Determine if this is a Docus/Nuxt Content project or generic Markdown documentation.

### Detection Indicators

**Check for Docus/Nuxt Content:**
1. **package.json dependencies:**
   - `"docus"` - Docus theme
   - `"@nuxt/content"` - Nuxt Content module
   - `"@nuxtjs/mdc"` - MDC support

2. **Configuration files:**
   - `nuxt.config.ts` or `nuxt.config.js` with `@nuxt/content` module
   - `content.config.ts` - Content collections configuration

3. **Content structure:**
   - `content/` or `docs/content/` directory
   - `.navigation.yml` files in subdirectories
   - MDC syntax in markdown files (`::component-name`)

4. **Project structure:**
   - Numbered directories (`1.getting-started/`, `2.guide/`)
   - Frontmatter with `navigation`, `seo` fields

### Project Type Classification

**Type A: Docus/Nuxt Content Project**
- All Docus-specific validations apply
- MDC component syntax checks (u- prefix requirement)
- Nuxt Content frontmatter structure
- Navigation files (.navigation.yml)
- Full technical validation

**Type B: Generic Markdown Documentation**
- Basic Markdown validation only
- Generic frontmatter (title, description, date, author)
- Standard Markdown syntax
- Focus on content quality (SEO, clarity, structure)
- No Docus-specific technical checks

### Detection Output

After detection, note in the report:
```
Project Type: [Docus/Nuxt Content | Generic Markdown]
Validation Mode: [Full (Docus-specific) | Basic (Markdown-only)]
```

**Adapt validation steps based on detected type:**
- **Type A (Docus):** Execute all steps with full validation
- **Type B (Generic):** Skip Docus-specific checks, focus on content quality

---

## Step 2: Analyze Documentation Structure

### Locate Content Directory

Find the documentation content directory:
- Check for `docs/content/` (most common)
- Check for `content/` (root-level)
- Check for `app/content/` (alternative location)

### Detect Locales

Identify language structure by examining subdirectories:

**Single language** (no locale subdirectories):
```
content/
├── index.md
├── 1.getting-started/
└── 2.guide/
```

**Multi-language** (locale subdirectories):
```
content/
├── en/
│   ├── index.md
│   ├── 1.getting-started/
│   └── 2.guide/
└── fr/
    ├── index.md
    ├── 1.getting-started/
    └── 2.guide/
```

**Detection logic:**
- If immediate subdirectories are 2-letter codes (en, fr, es, de, etc.), it's multi-language
- If immediate subdirectories are numbered (1.getting-started), it's single language

### List Documentation Sections

Identify all numbered directories within each locale:
- `1.getting-started/`
- `2.guide/` or `2.concepts/`
- `3.api/` or `3.essentials/`
- `4.advanced/` or `4.ai/`

For each section, note:
- Section name
- Presence of `.navigation.yml` file
- Number of pages (count `.md` files)
- Page file names

### Verify Core Files

Check for required files:
- [ ] `index.md` exists at root of each locale
- [ ] `.navigation.yml` in each section directory
- [ ] Numbered files follow pattern (`1.introduction.md`, `2.installation.md`)

### Create Structure Map

Document the structure for the report:
```
Project: [project-name]
Locales: [en, fr] (or "Single language")
Sections:
  - 1.getting-started: 5 pages, .navigation.yml ✅
  - 2.guide: 8 pages, .navigation.yml ✅
  - 3.api: 3 pages, .navigation.yml ❌ (missing)
```

---

## Step 3: Technical Validation

**Adapt validation based on project type detected in Step 1.**

### For Docus/Nuxt Content Projects (Type A)

Scan all `.md` files and validate technical correctness using [references/technical-checks.md](references/technical-checks.md).

### Frontmatter Validation

For each markdown file, extract and validate frontmatter:

**Required fields** (Critical if missing):
- `title` - String, max 100 chars (60 recommended for SEO)
- `description` - String, max 200 chars (160 recommended for SEO)

**Optional but recommended** (Important if suboptimal):
- `navigation.icon` - Format: `i-{collection}-{name}` (e.g., `i-lucide-rocket`)
- `navigation.title` - Custom sidebar label
- `seo.title` - SEO-optimized title (50-60 chars optimal)
- `seo.description` - SEO-optimized description (120-160 chars optimal)
- `links` - Array of related page links

**Validation checks:**
- [ ] Required fields present
- [ ] Field types correct (string, object, array)
- [ ] Icon format valid (starts with `i-`)
- [ ] Links array structure correct (objects with `label`, `to`, optional `icon`, `target`)
- [ ] No YAML syntax errors

**Critical errors:**
- Missing `title` or `description`
- Invalid YAML syntax
- Malformed `links` array

**Important warnings:**
- Description too short (<70 chars) or too long (>160 chars)
- Missing `seo` metadata
- Icon doesn't start with `i-`

### MDC Component Syntax

Scan file content for MDC components and validate:

**Critical check: u- prefix**

ALL Nuxt UI components MUST use `u-` prefix:

| Component Type | Incorrect | Correct |
|----------------|-----------|---------|
| Page Hero | `::page-hero` | `::u-page-hero` |
| Page Section | `::page-section` | `::u-page-section` |
| Page Grid | `::page-grid` | `::u-page-grid` |
| Page Card | `::page-card` | `::u-page-card` |
| Page Feature | `::page-feature` | `::u-page-feature` |
| Button | `::button` or `:::button` | `:::u-button` |
| Badge | `::badge` | `::u-badge` |
| Color Mode Image | `:color-mode-image` | `:u-color-mode-image` |

**Scan pattern:**
- Search for `::page-` → flag as missing `u-` prefix
- Search for `::button`, `::badge` → flag as missing `u-` prefix
- Search for `:color-mode-image` → flag as missing `u-` prefix

**Valid without u- prefix** (Nuxt Content components):
- `::code-group`, `::steps`, `::note`, `::tip`, `::warning`, `::caution`

**Nesting validation:**
- Ensure consistent nesting (:: at level 1, ::: at level 2, :::: at level 3)
- Flag inconsistent jumps (:: to :::: without :::)

### Code Block Validation

Check all code blocks for file path labels:

**Pattern:** ` ```language [file-path] `

**Files requiring labels** (Important if missing):
- TypeScript/JavaScript: `.ts`, `.js`, `.mjs`
- Vue: `.vue`
- Configuration: `.json`, `.yaml`, `.yml`
- Config files: `nuxt.config.ts`, `app.config.ts`, etc.

**Examples:**

✅ Good:
````markdown
```ts [nuxt.config.ts]
export default defineNuxtConfig({})
```
````

❌ Missing label:
````markdown
```ts
export default defineNuxtConfig({})
```
````

**Language tags:**
- Flag code blocks without language tags (` ``` ` instead of ` ```ts `)

### File Naming Conventions

Validate file and directory naming:

**Directory naming:**
- [ ] Numbered directories: `1.getting-started/`, `2.guide/`, etc.
- [ ] Kebab-case names (lowercase with hyphens)
- [ ] No gaps in numbering (1, 2, 3, not 1, 2, 4)

**File naming:**
- [ ] Numbered files: `1.introduction.md`, `2.installation.md`
- [ ] Kebab-case names
- [ ] `.md` extension

**Navigation files:**
- [ ] Each section has `.navigation.yml`
- [ ] File name exactly `.navigation.yml` (not `navigation.yml`)

### For Generic Markdown Projects (Type B)

**Simplified validation** - Skip Docus-specific checks:

**Basic Frontmatter Validation:**
- Check for common fields: `title`, `description`, `date`, `author`, `tags`
- No strict requirements - just recommendations
- Flag if completely missing frontmatter

**Standard Markdown Syntax:**
- Validate basic markdown (headings, lists, links, code blocks)
- Check for broken internal links
- Verify image paths exist

**Skip:**
- MDC component syntax (not applicable)
- Nuxt Content frontmatter structure
- `.navigation.yml` files
- Docus-specific conventions

**Focus on:**
- Content quality (next step)
- SEO optimization
- Clarity and readability
- General structure

---

## Step 4: Content Quality Review

**This step applies to ALL project types** (both Docus and generic Markdown).

Evaluate content quality across four dimensions using reference files.

Evaluate content quality across four dimensions using reference files.

### Clarity Review

Apply guidelines from [references/clarity-checks.md](references/clarity-checks.md):

**Voice and Tone:**
- [ ] Active voice (not passive)
- [ ] Present tense (not future)
- [ ] Second person ("you can")
- [ ] Direct and actionable

**Sentence Structure:**
- [ ] Target 15-20 words per sentence
- [ ] Flag sentences over 25 words
- [ ] Avoid wordy phrases ("in order to" → "to")

**Paragraph Structure:**
- [ ] 2-5 sentences per paragraph
- [ ] One main idea per paragraph
- [ ] 200-400 words between headings

**Action-Based Headings** (for Guide sections):
- [ ] H2/H3 use action verbs (Add, Configure, Create, Set up, Handle, Deploy)
- [ ] Not static nouns ("Configuration" → "Configure your app")
- [ ] Exception: Getting Started titles remain nouns ("Introduction", "Installation")

**Terminology:**
- [ ] Technical terms defined on first use
- [ ] Consistent terminology (not alternating "config"/"configuration")
- [ ] Product names capitalized consistently

**Code Examples:**
- [ ] Complete and copy-pasteable
- [ ] File path labels present
- [ ] Realistic variable names (not foo/bar)
- [ ] Comments explain non-obvious logic
- [ ] Multi-package manager support (use `::code-group`)

### SEO Review

Apply guidelines from [references/seo-checks.md](references/seo-checks.md):

**Page Titles:**
- [ ] Length: 50-60 characters (max 70)
- [ ] Contains primary keyword
- [ ] Unique across all pages
- [ ] Matches or relates to H1

**Meta Descriptions:**
- [ ] Length: 120-160 characters
- [ ] Includes keywords naturally
- [ ] Compelling and action-oriented
- [ ] Unique per page

**Heading Structure:**
- [ ] Single H1 per page (Critical)
- [ ] Heading hierarchy: H1 → H2 → H3 (no skipped levels)
- [ ] Descriptive headings (not "Overview", "Details")
- [ ] H2/H3 include relevant keywords

**URL Structure:**
- [ ] Lowercase, hyphen-separated (kebab-case)
- [ ] Descriptive and stable
- [ ] Follows numbered directory pattern
- [ ] Matches content hierarchy

**Internal Linking:**
- [ ] Links to related pages
- [ ] Descriptive anchor text (not "click here")
- [ ] Includes "Next steps" or related sections
- [ ] Important links in frontmatter `links` array

**Content Length:**
- [ ] Landing pages: 300+ words
- [ ] Guide pages: 400+ words
- [ ] Sections: 200-400 words between headings
- [ ] Flag pages under 100 words (too thin)
- [ ] Flag sections over 1000 words without breaks (poor scannability)

**Image Optimization:**
- [ ] Alt text present and descriptive
- [ ] Color mode images have both light/dark variants
- [ ] Image file names are descriptive

### Structure Review

Apply guidelines from [references/structure-checks.md](references/structure-checks.md):

**Content Hierarchy:**
- [ ] Maximum 3 levels (folders + headings)
- [ ] Logical section progression (Getting Started → Guide → API → Advanced)
- [ ] Standard section types present

**Section Organization:**
- [ ] Each section has 2-15 pages (flag 1 page or 20+ pages)
- [ ] `.navigation.yml` in all sections
- [ ] Icons follow recommendations (Getting Started: rocket, Guide: book-open, API: code)

**Content Flow:**
- [ ] Logical information progression
- [ ] Pages include "Next Steps" or related links
- [ ] Cross-references to related pages
- [ ] No orphaned pages (all reachable from navigation)

**Landing Page:**
- [ ] `index.md` exists at root of each locale
- [ ] Contains hero section, features, quick start, links to sections

**Consistency:**
- [ ] Similar page structure across documentation
- [ ] Consistent heading style
- [ ] Consistent code example format
- [ ] Consistent terminology usage

### i18n Review (Multi-language only)

If multi-language detected, apply guidelines from [references/i18n-checks.md](references/i18n-checks.md):

**Parallel Structure:**
- [ ] All locales have same directory structure
- [ ] All locales have matching file structure
- [ ] Same page count per section across locales

**Translation Completeness:**
- [ ] Content length similar across translations (±30%)
- [ ] Same number of major headings (H2) across translations
- [ ] Same sections and subsections
- [ ] Same code examples (with translated comments)

**Navigation Consistency:**
- [ ] `.navigation.yml` in all sections for all locales
- [ ] Same icons across locales
- [ ] Titles translated appropriately

**Locale-Specific:**
- [ ] No English text in non-English locales (except code/technical terms)
- [ ] Internal links point to correct locale
- [ ] Code comments translated
- [ ] Consistent terminology within each locale

---

## Step 5: Generate Report

Create a comprehensive review report using [assets/report-template.md](assets/report-template.md).

**Adapt report based on project type:**
- **Docus/Nuxt Content:** Include all sections (Technical, SEO, Clarity, Structure, i18n)
- **Generic Markdown:** Focus on content quality (SEO, Clarity, Structure), omit Docus-specific technical issues

### Report Structure

```markdown
# Documentation Review Report

**Generated:** [current date and time]
**Project:** [project name from package.json or directory]
**Reviewed:** [X] pages across [Y] sections in [locales]

---

## Executive Summary

- **Critical Issues:** [count] (must fix - block deployment/cause errors)
- **Important Issues:** [count] (significant impact on UX/SEO)
- **Nice-to-Have:** [count] (polish and optimization recommendations)

**Overall Assessment:** [1-2 sentence summary of documentation quality]

---

## Critical Issues

[List all Critical issues grouped by category]

### Technical: MDC Syntax Errors

#### Missing u- prefix on Nuxt UI components

**File:** `/content/en/1.getting-started/1.introduction.md:15`

**Problem:** Page hero component missing `u-` prefix

**Current:**
\`\`\`markdown
::page-hero
#title
Welcome
::
\`\`\`

**Should Be:**
\`\`\`markdown
::u-page-hero
#title
Welcome
::
\`\`\`

**Impact:** Component will not render, causing build errors

---

### Technical: Missing Frontmatter

[Similar format for each issue]

---

## Important Issues

[List all Important issues grouped by category: SEO, Clarity, Structure]

### SEO: Suboptimal Metadata

[Details with file paths and recommendations]

### Clarity: Passive Voice

[Details with examples and suggested rewrites]

### Structure: Poor Navigation

[Details with organizational recommendations]

---

## Nice-to-Have Suggestions

[List optimization suggestions by category]

### SEO Optimizations
- **[File]**: [Suggestion]

### Clarity Improvements
- **[File]**: Consider adding `::tip` callout for [specific content]

### Structure Enhancements
- **[Section]**: Consider splitting into subsections

---

## Locale-Specific Issues

[Only if multi-language detected]

### French (`/fr/`)
- [Translation issues]

---

## Statistics

### Content Overview

| Section | Pages (en) | Pages (fr) | Avg Words/Page |
|---------|------------|------------|----------------|
| Getting Started | [X] | [X] | ~[XXX] |
| Guide | [X] | [X] | ~[XXX] |

### Issue Breakdown

| Category | Critical | Important | Nice-to-Have | Total |
|----------|----------|-----------|--------------|-------|
| Technical | [X] | [X] | [X] | [X] |
| SEO | [X] | [X] | [X] | [X] |
| Clarity | [X] | [X] | [X] | [X] |
| Structure | [X] | [X] | [X] | [X] |
| i18n | [X] | [X] | [X] | [X] |
| **Total** | **[X]** | **[X]** | **[X]** | **[X]** |

---

## Positive Highlights

[Call out 2-3 things done well]
- Good use of callouts and code examples
- Consistent MDC component usage
- Well-organized section structure

---

## Recommended Action Plan

### Priority 1: Fix Critical Issues (Today)
1. [Specific actionable items]

**Estimated fixes:** [X] files

### Priority 2: Important Issues (This Week)
1. [Specific actionable items]

**Estimated fixes:** [X] files

### Priority 3: Nice-to-Have (Next Sprint)
1. [Specific actionable items]

**Estimated fixes:** [X] files

---

## Next Steps

**Would you like me to:**

1. **Fix all Critical issues** - I can automatically correct MDC syntax and frontmatter issues
2. **Rewrite specific sections** - Point out which pages need clarity improvements, and I'll rewrite them
3. **Optimize SEO metadata** - I can update all titles and descriptions to optimal lengths
4. **Restructure content** - If sections need reorganization, I can help restructure
5. **Complete translations** - If you need i18n content completed

**Or specify what you'd like to focus on first.**
```

### Report Generation Guidelines

**Be specific:**
- Include exact file paths and line numbers
- Show current vs. recommended code
- Explain why each issue matters (impact)

**Be actionable:**
- Provide clear fix instructions
- Include code examples
- Prioritize by impact

**Be balanced:**
- Highlight positive aspects
- Don't overwhelm with minor issues
- Focus on high-impact improvements

**After generating the report:**
- Offer to fix issues if the user requests
- Be ready to address specific categories or files
- Suggest starting with Critical issues

---

## Best Practices Quick Reference

### Common Critical Issues

| Issue | Detection | Fix |
|-------|-----------|-----|
| Missing u- prefix | `::page-hero` | `::u-page-hero` |
| Missing title | No `title:` in frontmatter | Add `title: Page Title` |
| Missing description | No `description:` in frontmatter | Add `description: ...` |
| Invalid YAML | Parse error in frontmatter | Fix YAML syntax |
| Missing .navigation.yml | Section directory without file | Create `.navigation.yml` |

### Common Important Issues

| Issue | Detection | Recommendation |
|-------|-----------|----------------|
| Long title | >70 characters | Shorten to 50-60 chars |
| Short description | <70 characters | Expand to 120-160 chars |
| Multiple H1s | Multiple `#` headings | Use single H1, rest H2/H3 |
| Passive voice | "can be done", "is handled" | Use active: "do", "handles" |
| Static headings | "Configuration" in guide | Use action: "Configure your app" |
| Missing code labels | ` ```ts ` without `[file]` | Add `[filename.ts]` |
| Generic headings | "Overview", "Details" | Use descriptive headings |

### Component Reference

**Require u- prefix:**
- `::u-page-hero`, `::u-page-section`, `::u-page-grid`, `::u-page-card`
- `:::u-button`, `::u-badge`
- `:u-color-mode-image`

**No u- prefix (Nuxt Content):**
- `::code-group`, `::steps`
- `::note`, `::tip`, `::warning`, `::caution`

### Icon Recommendations

| Section | Icon |
|---------|------|
| Getting Started | `i-lucide-rocket` |
| Guide / Concepts | `i-lucide-book-open` |
| API / Reference | `i-lucide-code` |
| Advanced | `i-lucide-settings` |
| AI / Assistant | `i-lucide-sparkles` |

---

## Example Review Session

```
User: "review my docs"
Assistant: I'll analyze your documentation for quality, clarity, SEO, and technical correctness.

[Executes Step 1: Detect Project Type]
Detected: Docus/Nuxt Content project (docus dependency found)

[Executes Step 2: Analyze Structure]
Found: 15 pages across 3 sections (en/), single language

[Executes Step 3: Technical Validation]
Detected 3 Critical issues (missing u- prefixes)

[Executes Step 4: Content Quality Review]
Identified 8 Important issues (SEO metadata, passive voice)

[Executes Step 5: Generate Report]

Here's your comprehensive documentation review report:
[Full report with categorized issues and actionable recommendations]

Would you like me to fix any of these issues?
```