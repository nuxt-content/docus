# Structure and Organization Guidelines

Guidelines for evaluating documentation structure, organization, and navigation patterns.

## Content Hierarchy

### Recommended Directory Structure

```
content/
├── {locale}/
│   ├── index.md                      # Landing page (required)
│   ├── 1.getting-started/
│   │   ├── .navigation.yml
│   │   ├── 1.introduction.md
│   │   ├── 2.installation.md
│   │   └── 3.quick-start.md
│   ├── 2.guide/                      # or 2.concepts/
│   │   ├── .navigation.yml
│   │   ├── 1.configuration.md
│   │   ├── 2.authentication.md
│   │   └── 3.deployment.md
│   ├── 3.api/                        # if applicable
│   │   ├── .navigation.yml
│   │   └── 1.reference.md
│   └── 4.advanced/                   # optional
│       ├── .navigation.yml
│       └── 1.customization.md
```

### Depth Guidelines

**Recommended:** Maximum 3 levels of nesting
- Level 1: Main sections (`1.getting-started/`)
- Level 2: Pages within sections (`1.introduction.md`)
- Level 3: Subsections via headings (H2, H3 within pages)

**Avoid:** Deep folder nesting (4+ levels) - use H2/H3 headings instead.

## Section Organization

### Standard Section Types

**1. Getting Started** (Always first)
- Introduction (what & why)
- Installation (prerequisites, commands)
- Quick Start / First Steps
- Project Structure (if applicable)

**2. Guide / Concepts** (Core documentation)
- Feature documentation
- Configuration guides
- Integration tutorials
- Best practices

**3. API / Reference** (If applicable)
- Component reference
- Composable reference
- Function reference
- Configuration options

**4. Advanced / Recipes** (Optional)
- Advanced patterns
- Customization guides
- Troubleshooting
- Migration guides

### Pages Per Section

**Guidelines:**
- **Minimum:** 2 pages per section (1 page = should be merged into another section)
- **Optimal:** 3-8 pages per section
- **Maximum:** 15 pages (beyond this, consider splitting into subsections)

**Red flags:**
- Section with 1 page only
- Section with 20+ pages (too broad, hard to navigate)

## Navigation Files

### .navigation.yml Structure

Each section directory should have `.navigation.yml`:

```yaml
title: Getting Started
icon: i-lucide-rocket
```

**Required fields:**
- `title`: Section display name in sidebar
- `icon`: Lucide icon (format: `i-lucide-{name}`)

### Icon Recommendations

| Section | Suggested Icons |
|---------|----------------|
| Getting Started | `i-lucide-rocket`, `i-lucide-play` |
| Guide / Concepts | `i-lucide-book-open`, `i-lucide-layers` |
| API / Reference | `i-lucide-code`, `i-lucide-book` |
| Advanced | `i-lucide-settings`, `i-lucide-wrench` |
| Deployment | `i-lucide-cloud`, `i-lucide-upload` |
| Troubleshooting | `i-lucide-alert-circle`, `i-lucide-help-circle` |

## Content Flow

### Logical Progression

Documentation should follow a learning path:

1. **Orientation** - What is this? Why use it?
2. **Setup** - How do I install it?
3. **Basics** - How do I use core features?
4. **Advanced** - How do I customize or extend?
5. **Reference** - Where can I find detailed API info?

### Page Structure

Each page should follow this pattern:

```markdown
---
frontmatter here
---

# H1 Page Title (matches frontmatter title)

Brief introduction (1-2 sentences describing what this page covers)

## First Major Topic (H2)

Content explaining the topic (200-400 words)

### Subtopic (H3)

Detailed information

## Second Major Topic (H2)

More content

## Next Steps

- Link to related pages
- Suggested reading order
```

### Next Steps / Related Content

**Every guide page should include:**
- Links to related documentation
- Suggested next pages
- Prerequisites or dependencies

**Examples:**

```markdown
## Next Steps

- [Configure your theme](/guide/configuration)
- [Add custom components](/guide/customization)
- [Deploy to production](/guide/deployment)

## Related

- [API Reference](/api/reference) - Detailed API documentation
- [Examples](/examples) - Real-world usage examples
```

## Cross-Referencing

### Internal Links

**Use relative links from the content root:**

✅ Good:
```markdown
Learn more about [authentication](/guide/authentication).
```

❌ Avoid:
```markdown
Learn more about [authentication](../guide/authentication.md).
```

### Link Patterns

**Inline links** for contextual references:
```markdown
Configure your app by setting up [environment variables](/guide/configuration#environment-variables).
```

**Callout links** for important related content:
```markdown
::note
This feature requires authentication. See the [Authentication Guide](/guide/authentication) for setup instructions.
::
```

**Frontmatter links** for primary related pages:
```yaml
---
links:
  - label: API Reference
    to: /api/reference
    icon: i-lucide-book
---
```

## Consistency Checks

### Across Pages

- [ ] Consistent heading style (action-based in guide sections)
- [ ] Similar page structure (intro → content → next steps)
- [ ] Consistent code example format
- [ ] Consistent terminology usage

### Across Sections

- [ ] All sections have `.navigation.yml`
- [ ] Numbered directories for consistent ordering
- [ ] Similar depth levels (avoid 2 levels in one section, 5 in another)
- [ ] Consistent icon style (all Lucide, no mixing)

## Common Structure Issues

### Orphaned Pages
- Pages with no incoming links
- No path from landing page to this page
- Not included in navigation

**Fix:** Add links from parent/related pages

### Redundant Content
- Multiple pages covering the same topic
- Duplicate information across sections
- Overlapping content without clear differentiation

**Fix:** Consolidate or clearly differentiate purpose

### Missing Landing Page
- Section without index.md
- Direct jump to numbered pages

**Fix:** Add index.md with section overview

### Inconsistent Numbering
- Gaps in numbering (1, 2, 4, 5 - where's 3?)
- Duplicate numbers (1.intro.md, 1.install.md in same directory)

**Fix:** Renumber files consistently

### Poor Information Architecture
- Guide content in Getting Started section
- Basic setup in Advanced section
- API reference mixed with tutorials

**Fix:** Reorganize into appropriate sections

## Landing Page Structure

The main landing page (`index.md`) should include:

1. **Hero Section** - Project name, tagline, CTA
2. **Key Features** - 3-6 main features with icons
3. **Quick Start** - Minimal example or install command
4. **Links to Sections** - Getting Started, Guide, API
5. **Optional:** Showcase, testimonials, sponsors

**Example Structure:**

```markdown
---
title: Project Name
description: Project tagline
---

::u-page-hero
# Hero content
::

::u-page-section
# Features
  :::u-page-grid
  # Feature cards
  :::
::

::u-page-section
# Quick Start
# Minimal code example
::
```

## Validation Checklist

- [ ] Landing page (index.md) exists at root of each locale
- [ ] All sections have `.navigation.yml` with title and icon
- [ ] Numbered directories follow consistent pattern (1., 2., 3.)
- [ ] Pages within sections are numbered consistently
- [ ] Maximum 3 levels of hierarchy (folders + headings)
- [ ] Each section has 2-15 pages (not 1, not 20+)
- [ ] Pages include "Next Steps" or related links
- [ ] No orphaned pages (all reachable from navigation)
- [ ] Logical progression (Getting Started → Guide → API → Advanced)
- [ ] Consistent heading depth (no lonely H4s without H3)
