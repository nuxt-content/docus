# Writing Guide

Guidelines for writing effective documentation content.

## Table of Contents

- [Action-Based Content](#action-based-content)
- [Page Titles](#page-titles)
- [Voice and Tone](#voice-and-tone)
- [Code Examples](#code-examples)

---

## Action-Based Content

Use action verbs in **H2/H3 headings** to make pages scannable and task-oriented.

| Static heading | Action-based heading |
|----------------|---------------------|
| Configuration | Configure your app |
| Database setup | Connect a database |
| Route protection | Protect your routes |
| Session management | Handle user sessions |
| Error handling | Handle errors gracefully |
| Deployment | Deploy your application |

### Action Verbs to Use

**Primary:** Add, Configure, Create, Set up, Enable, Connect, Handle, Customize, Deploy, Use

**Secondary:** Build, Implement, Integrate, Install, Define, Write, Run, Test, Debug, Update

---

## Page Titles

Different sections use different title styles:

| Section | Style | Examples |
|---------|-------|----------|
| Getting Started | Nouns | Introduction, Installation, Quick Start |
| Guide | Topics | Authentication, Configuration, Deployment |
| API | Function/Component names | useSession, fetchData, Button |
| Recipes | Action phrases | Add Dark Mode, Deploy to Vercel |

The action style lives in the **content headings**, not the page titles or file names.

---

## Voice and Tone

### Do

- Use **active voice** and **present tense**
- Write in **second person** ("you can", "your project")
- Be **direct** and **actionable**
- Start sentences with **action verbs** when possible

### Examples

| Passive/Wordy | Active/Direct |
|---------------|---------------|
| The configuration can be set by... | Configure your app by... |
| It is recommended that you... | We recommend... |
| The file should be created in... | Create the file in... |
| Authentication is handled by... | Handle authentication with... |

---

## Code Examples

### File Path Labels

Always add file path labels to code blocks:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  // ...
})
```

### Multi-Package Manager Examples

Use `::code-group` and show the **detected package manager first**:

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

### Best Practices

- Include **working, copy-pasteable** examples
- Show **complete** code, not fragments
- Add **comments** for complex logic
- Use **realistic** variable names
