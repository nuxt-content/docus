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

Perform full technical validation using [references/technical-checks.md](references/technical-checks.md):

**Validate:**
1. **Frontmatter structure** - Required: `title`, `description`. Optional: `navigation`, `seo`, `links`
2. **MDC component syntax** - All Nuxt UI components MUST have `u-` prefix (`::u-page-hero`, `:::u-button`)
3. **Code block labels** - Config files need file path labels (` ```ts [nuxt.config.ts] `)
4. **File naming** - Numbered directories/files, kebab-case, `.navigation.yml` in each section

**Common Critical Errors:**
- Missing `u-` prefix: `::page-hero` → should be `::u-page-hero`
- Missing required frontmatter: `title`, `description`
- Invalid `.navigation.yml` structure

See [references/technical-checks.md](references/technical-checks.md) for complete validation rules, examples, and error patterns.

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

Evaluate content quality across four dimensions. Refer to reference files for detailed checklists.

### Clarity Review

Use [references/clarity-checks.md](references/clarity-checks.md) to check:
- **Voice & Tone:** Active voice, present tense, second person
- **Sentence Structure:** 15-20 words target, avoid wordy phrases
- **Paragraph Structure:** 2-5 sentences, 200-400 words between headings
- **Action-Based Headings:** Page titles (H1) and headings (H2/H3) use action verbs for guides (Nuxt pattern)
  - Examples: "Create Your First Module", "Configure your app", "Build a Plugin"
  - Exceptions: Getting Started (nouns), API (function names), Concepts (descriptive)
- **Terminology:** Consistent naming, technical terms defined
- **Code Examples:** Complete, copy-pasteable, realistic, with file labels

### SEO Review

Use [references/seo-checks.md](references/seo-checks.md) to check:
- **Titles:** 50-60 chars, keywords, unique
- **Descriptions:** 120-160 chars, compelling, unique
- **Headings:** Single H1, logical hierarchy (H1→H2→H3), descriptive
- **URLs:** Kebab-case, descriptive, stable
- **Links:** Descriptive anchors, "Next steps" sections
- **Content Length:** 300+ words for landing, 400+ for guides, 200-400 per section
- **Images:** Alt text, color mode variants

### Structure Review

Use [references/structure-checks.md](references/structure-checks.md) to check:
- **Hierarchy:** Max 3 levels, logical progression
- **Organization:** 2-15 pages per section, `.navigation.yml` present, appropriate icons
- **Flow:** Logical progression, "Next Steps" links, no orphaned pages
- **Landing Page:** Hero, features, quick start
- **Consistency:** Similar structure across pages

### i18n Review (if multi-language)

Use [references/i18n-checks.md](references/i18n-checks.md) to check:
- **Parallel Structure:** Same directories, files, page counts across locales
- **Translation Completeness:** Similar content length (±30%), same headings
- **Navigation:** Same icons, translated titles
- **Locale-Specific:** No mixed languages, correct internal links, translated comments

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

## Quick Reference

**Most Common Issues:**
- Missing `u-` prefix on Nuxt UI components (`::page-hero` → `::u-page-hero`)
- SEO descriptions too short (need 120-160 chars)
- Passive voice in instructions ("can be done" → "do it")
- Generic headings ("Configuration" → "Configure your app")

**See reference files for complete checklists and examples.**