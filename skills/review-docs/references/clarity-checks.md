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

### Best Practice: Follow the Nuxt Pattern

Modern documentation (like [Nuxt](https://nuxt.com/docs)) uses **action verbs throughout** for guide and tutorial pages. This makes documentation scannable and task-oriented.

### When to Use Action Verbs

**Page Titles (H1)** - Use action verbs for:
- Guide pages: "Create Your First Module", "Build a Custom Plugin"
- Tutorial pages: "Deploy Your Application", "Set Up Authentication"
- How-to pages: "Add Dark Mode", "Configure Environment Variables"
- Recipe pages: "Implement Real-time Updates"

**Headings (H2/H3)** - Use imperative verbs for:
- All steps within guides and tutorials
- Sequential actions
- Configuration sections
- Implementation details

### When to Use Nouns (Exceptions)

- **File names:** Always remain nouns/kebab-case (`1.introduction.md`, `2.installation.md`)
- **Getting Started titles:** "Introduction", "Installation", "Quick Start" (orientation pages)
- **API reference pages:** Use function/component names ("useSession", "Button", "defineNuxtConfig")
- **Concept pages:** Can use nouns when explaining theory ("Architecture", "Core Concepts", "Best Practices")

### Action Verb Examples

| Category | Verbs |
|----------|-------|
| Primary | Create, Build, Use, Develop, Run, Publish, Add, Configure, Set up, Enable, Connect |
| Secondary | Handle, Customize, Deploy, Implement, Integrate, Install, Define, Write, Test, Debug, Update |

### Real-World Examples (Nuxt Pattern)

**Page Title (H1):**
```markdown
# Create Your First Module
```

**Section Headings (H2):**
```markdown
## Create a Module
## Use the Starter Template
## Develop Your Module
```

**Subsection Headings (H3):**
```markdown
### Run Tests
### Build Your Module
### Publish to npm
```

### Bad vs Good Examples

| Static/Noun (Avoid) | Action-Based (Use) |
|---------------------|-------------------|
| Configuration | Configure your app |
| Module Creation | Create a new module |
| Database setup | Connect a database |
| Route protection | Protect your routes |
| Session management | Handle user sessions |
| Error handling | Handle errors gracefully |
| Testing | Run your tests |
| Deployment | Deploy to production |

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
