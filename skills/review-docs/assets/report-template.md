# Documentation Review Report

**Generated:** [timestamp]
**Project:** [project-name]
**Reviewed:** [number] pages across [number] sections in [locales]

---

## Executive Summary

- **Critical Issues:** X (must fix - block deployment/cause errors)
- **Important Issues:** Y (significant impact on UX/SEO)
- **Nice-to-Have:** Z (polish and optimization recommendations)

**Overall Assessment:** [Brief 1-2 sentence summary of documentation quality]

---

## Critical Issues

> Issues that must be fixed as they cause build errors or critical functionality problems.

### [Issue Category]

**Priority:** Critical
**Impact:** [Brief description of what breaks if not fixed]

#### Issue 1: [Short description]

**File:** [/path/to/file.md:line-number]

**Problem:**
[Detailed explanation of the issue]

**Current:**
```markdown
[Current problematic code]
```

**Should Be:**
```markdown
[Corrected code]
```

**Why:** [Explanation of why this is critical]

---

## Important Issues

> Issues that significantly impact user experience or SEO but don't break functionality.

### SEO Issues

#### Issue 1: [Short description]

**File:** [/path/to/file.md]

**Problem:** [Description]

**Current:** [Example]

**Recommendation:** [Specific fix]

**Impact:** [How this affects SEO or UX]

### Clarity Issues

[Similar structure]

### Structure Issues

[Similar structure]

---

## Nice-to-Have Suggestions

> Recommendations for polish and optimization. Not urgent but improve overall quality.

### SEO Optimizations

- **[File path]**: [Suggestion]
- **[File path]**: [Suggestion]

### Clarity Improvements

- **[File path]**: Consider adding callout (::tip) for [specific content]
- **[File path]**: Code example could be more realistic

### Structure Enhancements

- **[Section]**: Consider splitting into subsections for better navigation
- **[Section]**: Add cross-references to related pages

---

## Locale-Specific Issues

> Multi-language documentation specific concerns (only if i18n detected)

### French (`/fr/`)

- [Issue with French translation/structure]
- [Issue with French content]

### [Other locale]

- [Locale-specific issues]

---

## Statistics

### Content Overview

| Section | Pages (en) | Pages (fr) | Avg Words/Page |
|---------|------------|------------|----------------|
| Getting Started | X | X | ~XXX |
| Guide | X | X | ~XXX |
| API | X | X | ~XXX |

### Issue Breakdown

| Category | Critical | Important | Nice-to-Have | Total |
|----------|----------|-----------|--------------|-------|
| Technical (MDC/Frontmatter) | X | X | X | X |
| SEO | X | X | X | X |
| Clarity | X | X | X | X |
| Structure | X | X | X | X |
| i18n | X | X | X | X |
| **Total** | **X** | **X** | **X** | **X** |

---

## Positive Highlights

[Call out 2-3 things the documentation does well]

- Good use of callouts and code examples
- Consistent MDC component usage
- Well-organized section structure
- Strong SEO metadata on landing pages

---

## Recommended Action Plan

### Priority 1: Fix Critical Issues (Today)

1. Fix all MDC syntax errors (missing u- prefixes)
2. Add missing required frontmatter fields
3. Correct broken navigation structure

**Estimated fixes:** X files

### Priority 2: Important Issues (This Week)

1. Optimize SEO metadata (titles/descriptions)
2. Rewrite sections with clarity issues (passive voice, unclear sentences)
3. Fix heading hierarchy problems
4. Complete missing translations (if applicable)

**Estimated fixes:** X files

### Priority 3: Nice-to-Have (Next Sprint)

1. Add suggested callouts and examples
2. Enhance internal linking
3. Improve code example realism
4. Add FAQ-style headings

**Estimated fixes:** X files

---

## Next Steps

**Would you like me to:**

1. **Fix all Critical issues** - I can automatically correct MDC syntax and frontmatter issues
2. **Rewrite specific sections** - Point out which pages need clarity improvements, and I'll rewrite them
3. **Optimize SEO metadata** - I can update all titles and descriptions to optimal lengths
4. **Restructure content** - If sections need reorganization, I can help restructure
5. **Complete translations** - If you need i18n content completed

**Or specify what you'd like to focus on first.**

---

## Appendix: Detailed File-by-File Analysis

<details>
<summary>Click to expand full file-by-file breakdown</summary>

### /en/1.getting-started/1.introduction.md

**Frontmatter:** ✅ Valid
**MDC Syntax:** ✅ No issues
**SEO:** ⚠️ Description too short (85 chars, aim for 120-160)
**Clarity:** ✅ Good active voice, clear structure
**Structure:** ✅ Logical flow, includes next steps

**Recommendations:**
- Expand meta description to 120-160 characters

---

### /en/1.getting-started/2.installation.md

[Similar detailed breakdown for each file]

</details>
