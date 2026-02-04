# Clarity Review Guidelines

Guidelines for evaluating content clarity and readability in Docus documentation.

## Voice and Tone

### Active Voice
✅ Good: "Configure your app by adding..."
❌ Avoid: "The app can be configured by adding..."

### Present Tense
✅ Good: "The server handles requests..."
❌ Avoid: "The server will handle requests..."

### Second Person
✅ Good: "You can customize the theme..."
❌ Avoid: "Users can customize the theme..."

## Sentence Structure

**Target:** 15-20 words per sentence
**Maximum:** 25 words before flagging for review

Examples:
- Too long (32 words): "When you want to configure your application to use authentication with OAuth providers you should first install the required dependencies and then configure your environment variables."
- Better (split into 2): "First, install the required dependencies for OAuth. Then, configure your environment variables for authentication."

## Paragraph Structure

**Guidelines:**
- 2-5 sentences per paragraph
- One main idea per paragraph
- 200-400 words between headings

## Action-Based Headings

### When to Use
Use action verbs in H2/H3 headings for:
- Guide sections (`2.guide/`, `2.concepts/`)
- Tutorial content
- How-to documentation
- Recipe pages

### Do NOT Use Action Verbs For
- Page titles (file names remain nouns)
- Getting Started section titles ("Introduction", "Installation")
- API reference pages (use function/component names)

### Action Verb Examples

| Category | Verbs |
|----------|-------|
| Primary | Add, Configure, Create, Set up, Enable, Connect, Handle, Customize, Deploy, Use |
| Secondary | Build, Implement, Integrate, Install, Define, Write, Run, Test, Debug, Update |

| Static (Avoid) | Action-Based (Use) |
|----------------|-------------------|
| Configuration | Configure your app |
| Database setup | Connect a database |
| Route protection | Protect your routes |
| Session management | Handle user sessions |
| Error handling | Handle errors gracefully |

## Terminology Consistency

**Check for:**
- Alternating between "config" and "configuration"
- Switching between "app" and "application"
- Inconsistent capitalization ("nuxt" vs "Nuxt")
- Mixed terminology for same concept

**Validate:**
- Technical terms defined on first use
- Consistent naming throughout
- Product-specific terms used systematically

## Code Examples

### Quality Checklist
- [ ] Complete and copy-pasteable (not fragments)
- [ ] File path labels present (` ```ts [nuxt.config.ts] `)
- [ ] Comments explain non-obvious logic
- [ ] Realistic variable names (not foo/bar)
- [ ] Working code (no placeholder values like `YOUR_API_KEY`)
- [ ] Consistent indentation and style

### Multi-Package Manager Support

Always use `::code-group` for install commands:

```markdown
::code-group
```bash [pnpm]
pnpm add package-name
```

```bash [npm]
npm install package-name
```

```bash [yarn]
yarn add package-name
```

```bash [bun]
bun add package-name
```
::
```

## Common Clarity Issues

### Passive Voice in Instructions
❌ "The file should be created in the root directory"
✅ "Create the file in the root directory"

### Wordy Phrases
| Wordy | Concise |
|-------|---------|
| In order to | To |
| It is important to note that | Note: |
| At this point in time | Now |
| Due to the fact that | Because |

### Vague Pronouns
❌ "This allows you to..."
✅ "This configuration allows you to..."

### Unexplained Jargon
❌ "Use SSR for better performance"
✅ "Use Server-Side Rendering (SSR) for better performance"
