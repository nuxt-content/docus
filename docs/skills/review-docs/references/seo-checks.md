# SEO Review Guidelines

Comprehensive SEO best practices for Docus documentation sites.

## Page Titles

### Length Guidelines
- **Optimal:** 50-60 characters
- **Maximum:** 70 characters (search engines truncate beyond this)
- **Minimum:** 30 characters (too short looks incomplete)

### Best Practices
- [ ] Contains primary keyword
- [ ] Unique across all pages
- [ ] Matches or clearly relates to H1
- [ ] Descriptive and specific (not "Documentation" or "Guide")

### Examples

| Poor | Better | Great |
|------|--------|-------|
| Installation | Install | Install Docus in Your Nuxt Project |
| Configuration | Configure | Configure Docus Theme Settings |
| API | API Reference | API Reference: Composables and Helpers |

## Meta Descriptions

### Length Guidelines
- **Optimal:** 120-160 characters
- **Maximum:** 160 characters (truncated in search results)
- **Minimum:** 70 characters (too short is a missed opportunity)

### Best Practices
- [ ] Includes target keywords naturally
- [ ] Compelling and action-oriented
- [ ] Accurately summarizes page content
- [ ] Unique per page (no duplicates)

### Examples

✅ Good (145 chars): "Learn how to install and configure Docus in your Nuxt project. Set up your documentation site with search, dark mode, and AI integration."

❌ Too short (42 chars): "Documentation setup guide for Docus theme"

❌ Too long (185 chars): "This comprehensive guide will walk you through the complete process of installing, configuring, and customizing the Docus documentation theme for your Nuxt application with all features."

## Heading Structure

### H1 Requirements
- [ ] **Single H1 per page** (critical for SEO)
- [ ] Matches or relates to `<title>` tag
- [ ] Contains primary keyword
- [ ] Descriptive and specific

### Heading Hierarchy
- [ ] No skipped levels (H1 → H2 → H3, never H1 → H3)
- [ ] Logical flow and nesting
- [ ] Each heading is unique on the page

### Descriptive Headings

Avoid generic headings that don't convey meaning:

| Generic (Avoid) | Descriptive (Use) |
|-----------------|-------------------|
| Overview | Authentication Overview |
| Getting Started | Getting Started with OAuth |
| Details | Configuration Details |
| Advanced | Advanced Routing Patterns |
| Options | Configuration Options |

### Keyword Optimization

H2 and H3 headings should:
- Include relevant keywords naturally
- Answer user questions (FAQ-style when appropriate)
- Be scannable (users often skip to headings)

**Example FAQ-style headings:**
- "How do I rotate an API key?"
- "What is the difference between OAuth and JWT?"
- "When should I use server-side rendering?"

## URL Structure

### Best Practices
- [ ] Lowercase, hyphen-separated (`kebab-case`)
- [ ] Descriptive and stable (don't change after publishing)
- [ ] Follows numbered directory pattern (`1.getting-started/`, `2.guide/`)
- [ ] Matches content hierarchy
- [ ] Avoids special characters and underscores

### Examples

✅ Good:
- `/en/getting-started/installation`
- `/en/guide/authentication`
- `/en/api/composables`

❌ Avoid:
- `/en/getting_started/installation` (underscores)
- `/en/GetStarted/Installation` (not lowercase)
- `/en/p/123` (not descriptive)
- `/en/docs-page` (too generic)

## Internal Linking

### Strategy
- Link to related documentation pages
- Use descriptive anchor text (not "click here" or "here")
- Include "Next steps" or "Related" sections
- Add important links to frontmatter `links` array

### Anchor Text Best Practices

| Poor | Better |
|------|--------|
| Click here | Learn about authentication |
| Read more | Configure OAuth providers |
| See this page | View the API reference |
| Documentation | Deployment documentation |

### Links in Frontmatter

For important related links, use frontmatter `links` array:

```yaml
---
links:
  - label: "API Reference"
    icon: "i-lucide-book"
    to: "/api/reference"
  - label: "GitHub Repository"
    icon: "i-simple-icons-github"
    to: "https://github.com/..."
    target: "_blank"
---
```

## Content Length

### Guidelines by Page Type

| Page Type | Minimum | Optimal | Notes |
|-----------|---------|---------|-------|
| Landing (index.md) | 300 words | 500-800 | Hero + feature overview |
| Guide page | 400 words | 600-1200 | Detailed instructions |
| API reference | 200 words | 400-800 | Concise technical reference |
| Getting Started | 300 words | 500-1000 | Clear onboarding |

### Section Length
- **Minimum:** 100 words (anything less is "thin content")
- **Optimal:** 200-400 words per section (between H2/H3 headings)
- **Maximum:** 1000 words before breaking into subsections

**Red flags:**
- Pages under 100 words (too thin, low SEO value)
- Sections over 1000 words without subheadings (poor scannability)

## Image Optimization

### Alt Text
- [ ] Descriptive and specific (not "image" or "screenshot")
- [ ] Includes relevant keywords naturally
- [ ] Describes image content for accessibility
- [ ] 50-125 characters optimal

### Color Mode Images

Always provide both light and dark variants:

```markdown
:u-color-mode-image{
  alt="Dashboard showing user analytics"
  light="/images/dashboard-light.png"
  dark="/images/dashboard-dark.png"
  class="rounded-lg"
  width="859"
  height="400"
}
```

### Image File Names
- Use descriptive kebab-case names
- Include context: `dashboard-analytics.png` not `screenshot-1.png`

## Common SEO Issues

### Duplicate Metadata
❌ Multiple pages with same title or description
✅ Each page has unique, descriptive metadata

### Missing Metadata
❌ No `seo.title` or `seo.description` in frontmatter
✅ All pages have SEO metadata defined

### Keyword Stuffing
❌ "Docus Docus documentation Docus theme Docus guide"
✅ Natural language with keywords integrated contextually

### Broken Internal Links
❌ Links to `/getting-started/` when actual path is `/en/getting-started/`
✅ Links match the actual file structure and language prefixes

## Verification Checklist

Run through this checklist for each page:

- [ ] Title: 50-60 chars, contains keyword, unique
- [ ] Description: 120-160 chars, compelling, accurate
- [ ] Single H1, matches title
- [ ] Heading hierarchy is logical (no skipped levels)
- [ ] H2/H3 headings are descriptive, not generic
- [ ] URL is stable, descriptive, lowercase-hyphenated
- [ ] Internal links use descriptive anchor text
- [ ] Content is 300+ words for substantial pages
- [ ] Sections are 200-400 words between headings
- [ ] Images have descriptive alt text
- [ ] Color mode images have both light/dark variants
