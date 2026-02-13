# Internationalization (i18n) Guidelines

Guidelines for reviewing multi-language documentation consistency in Docus.

**Note:** These checks only apply if multi-language support is detected (multiple locale directories: `en/`, `fr/`, etc.)

## Locale Detection

Check for multiple language directories in `content/`:

```
content/
├── en/          # English
├── fr/          # French
└── es/          # Spanish (if applicable)
```

If only one language directory exists, skip i18n checks.

## Parallel Structure

### Directory Parity

All locales should have the same directory structure:

✅ Correct:
```
content/
├── en/
│   ├── 1.getting-started/
│   ├── 2.guide/
│   └── 3.api/
└── fr/
    ├── 1.getting-started/
    ├── 2.guide/
    └── 3.api/
```

❌ Inconsistent:
```
content/
├── en/
│   ├── 1.getting-started/
│   ├── 2.guide/
│   ├── 3.api/
│   └── 4.advanced/        # Only in English
└── fr/
    ├── 1.getting-started/
    └── 2.guide/            # Missing sections
```

### File Parity

Each locale should have matching files:

✅ Correct:
```
en/1.getting-started/
├── 1.introduction.md
├── 2.installation.md
└── 3.quick-start.md

fr/1.getting-started/
├── 1.introduction.md
├── 2.installation.md
└── 3.quick-start.md
```

❌ Missing translations:
```
en/1.getting-started/
├── 1.introduction.md
├── 2.installation.md
└── 3.quick-start.md

fr/1.getting-started/
├── 1.introduction.md
└── 2.installation.md     # Missing quick-start
```

## Translation Completeness

### Content Length Comparison

**Expected:** Similar content length across translations (±30%)

**Red flags:**
- English page: 1000 words, French page: 200 words (likely incomplete)
- English page has 5 H2 sections, French has 2 (missing content)

### Structural Completeness

Check that translations include:
- Same number of major headings (H2)
- Same sections and subsections
- Same code examples
- Same callouts (::note, ::tip, etc.)
- Same component usage (::u-page-hero, etc.)

### Visual Content

- [ ] Images exist in all language versions
- [ ] Screenshots localized if they contain text
- [ ] Diagrams translated if they contain labels
- [ ] Color mode images (light/dark) available for all locales

## Navigation Consistency

### .navigation.yml Files

Each section should have `.navigation.yml` in all locales:

```yaml
# en/1.getting-started/.navigation.yml
title: Getting Started
icon: i-lucide-rocket

# fr/1.getting-started/.navigation.yml
title: Premiers Pas
icon: i-lucide-rocket    # Same icon across locales
```

**Validation:**
- [ ] Same icon used across locales
- [ ] Title translated appropriately
- [ ] All sections have navigation files in all locales

## Locale-Specific Issues

### Language-Specific Checks

**English:**
- Active voice
- Present tense
- Second person

**French:**
- Correct formal/informal tone (tu vs vous)
- Proper accents (é, è, à, etc.)
- Agreement (gender/number)

**Other languages:**
- Appropriate formality level
- Correct grammar and syntax
- Cultural appropriateness

### Code Examples

**Keep consistent across locales:**
- Variable names (usually English)
- Function names
- Technical terminology
- Package names

**Translate:**
- Comments in code blocks
- String values where appropriate
- Console output messages

**Example:**

English:
````markdown
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  // Configure your app
  app: {
    name: 'My App'
  }
})
```
````

French:
````markdown
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  // Configurez votre application
  app: {
    name: 'Mon Application'
  }
})
```
````

## Common i18n Issues

### Partial Translations

**Issue:** Documentation started in one language, partially translated to others.

**Detection:**
- Missing files in some locales
- Incomplete page content (much shorter than original)
- Untranslated sections within otherwise translated pages

**Fix:** Either complete translations or clearly mark incomplete sections.

### Inconsistent Terminology

**Issue:** Same technical term translated differently across pages.

**Example:**
- Page 1: "authentication" → "authentification"
- Page 2: "authentication" → "connexion"
- Page 3: "authentication" → "identification"

**Fix:** Choose one translation and use consistently. Create a terminology glossary.

### Mixed Languages

**Issue:** English text appearing in non-English locales (besides code/technical terms).

**Common examples:**
- English headings in French pages
- Untranslated navigation labels
- English error messages
- Mixed language in same paragraph

**Fix:** Translate all user-facing text except code, package names, and established technical terms.

### URL Mismatches

**Issue:** Internal links not updated for locale.

❌ Wrong (in French docs):
```markdown
See [installation guide](/en/getting-started/installation)
```

✅ Correct:
```markdown
See [guide d'installation](/fr/getting-started/installation)
```

### Missing Locale Configuration

Check that `nuxt.config.ts` or `app.config.ts` includes i18n configuration:

```ts
// nuxt.config.ts or app/app.config.ts
i18n: {
  defaultLocale: 'en',
  locales: [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' }
  ]
}
```

## Validation Checklist

If multi-language detected:

- [ ] All locales have same directory structure
- [ ] All locales have matching file structure (same page count per section)
- [ ] All `.navigation.yml` files exist in all locales with same icons
- [ ] Content length is similar across translations (±30%)
- [ ] No English text in non-English pages (except code/technical terms)
- [ ] Internal links point to correct locale
- [ ] Code comments translated appropriately
- [ ] Consistent terminology within each locale
- [ ] Locale configuration present in Nuxt config
- [ ] Landing pages exist for all locales
