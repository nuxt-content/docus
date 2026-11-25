---
name: release-notes
description: Write the Highlights and New documentation of a Docus release in the body of the open uppt release PR. Use when asked to write release notes, do the release notes, or prepare a release. uppt already writes the changelog and contributors; this adds the parts that need judgement.
---

Docus releases with [uppt](https://github.com/danielroe/uppt) (`.github/workflows/release.yml`).
Each push to `main` opens or updates a draft `release/vX.Y.Z` PR whose body is
the changelog and contributors under `## 👉 Changelog`. Merging the PR creates
the GitHub release from that body. uppt keeps everything **above**
`## 👉 Changelog` when it refreshes the PR, so that is where the Highlights and
the New documentation list go.

The generator drafts the new PR body into `v<version>.md` at the repo root;
**you** write the Highlights and the New documentation list, then update the
PR once the user approves.

**When to run:** before merging the release PR, once it contains everything
that should ship.

**Patch releases** (`x.y.z` with `z > 0`) have no Highlights section. The
generator detects this from the version, so for a patch skip step 2.

## Steps

### 1. Generate the draft

```bash
node .claude/skills/release-notes/scripts/generate.mjs      # the open release PR
node .claude/skills/release-notes/scripts/generate.mjs 1510 # when several are open (stable and prerelease)
```

This reads the release PR body, fetches the previous tag and the release
branch, and writes `v<version>.md` with the current PR body plus:

- a `## ✨ Highlights` placeholder (yours to fill), minor and major versions only,
- a `## 📚 New documentation` placeholder when `docs/content/en` changed.

Sections already in the PR body are kept and not added twice. It prints the
**highlight candidates** (Enhancements, Performance and `⚠️` breaking
bullets), the **new documentation candidates** (new pages and new `##`/`###`
headings) and the commit co-authors. `gh` must be authenticated
(`gh auth status`).

### 2. Write the Highlights (minor and major versions only)

Skip this step for a patch release, even when a fix is notable.

Pick **2 to 4** changes, most impactful first. Candidates include Performance:
a minor can ship without features (v5.15.0 was all performance work).

Good highlight material:

- a **new capability** users turn on or configure (an `app.config.ts` key, a
  `nuxt.config.ts` option, a new component, slot or composable),
- a **broad or cross-cutting** change (assistant, MCP, llms.txt and agents,
  search, SEO, i18n, theming, performance),
- something that closes a long-standing or popular request.

Skip narrow fixes, docs fixes and internal refactors. For each highlight write:

````md
### 🤖 Short title

One or two sentences on what it does and why it matters, linking the
[guide](https://docus.dev/en/ai/assistant#custom-provider).

```ts [app.config.ts]
// a minimal, real example
```

> [!TIP]
> Optional callout for a caveat or neat detail.
````

Rules:

- **Verify before you write.** Check option names, defaults and components
  against the merged PR (`gh pr view <n> --repo nuxt-content/docus`),
  `docs/content/en/**`, `layer/index.d.ts` (`nuxt.config` options),
  `layer/app/types/index.d.ts` and `layer/nuxt.schema.ts` (`app.config`),
  `layer/modules/**` and `layer/app/components/**`. Never invent an API.
- **Match the voice**: concise, direct, no em dashes, reads like Baptiste wrote it.
  Look at the last few releases for tone:
  `gh release list --repo nuxt-content/docus --limit 5`, then
  `gh release view <tag> --repo nuxt-content/docus`.
- **Describe what actually shipped, not what it enables.** A title must match the
  real change. Don't inflate a small option into a big feature (e.g. a `vary`
  header on markdown negotiation is a caching fix, not "agent-ready docs").
- When unsure, prefer fewer, accurate highlights over four.
- Emojis: `🤖` assistant/MCP/agents, `🏎️` performance, `🔍` search/SEO,
  `🎨` theming/customization, `🌐` i18n, `🧩` components, `♿` accessibility.

### 3. Breaking changes and upgrade notes

If a changelog bullet starts with `⚠️`, or a feature/fix requires users to
change their project on upgrade (check the PR description), add a callout with
the migration step and a docs link, in a section above `## 👉 Changelog`
(uppt rewrites everything below it):

```md
## ⚠️ Upgrade notes

> [!WARNING]
> What changed, what to do, and a [link to the docs](https://docus.dev/en/...).
```

### 4. Fill New documentation (any release with candidates)

Keep only pages and sections that document something new in this release.
Drop headings that were renamed, moved or reworded. Check each anchor against
the heading on the page. List them as bare URLs, one per bullet:

```md
## 📚 New documentation

* https://docus.dev/en/ai/assistant#custom-provider
```

Delete the section if nothing qualifies.

### 5. Sanity-check, then update the PR

- uppt lists commit authors only. If a co-author printed by the generator is
  missing from `### ❤️ Contributors`, mention them in the Highlights or ask the
  user how to credit them.
- Remove any leftover `<!-- TODO -->` comment.
- Show the user the sections you added above `## 👉 Changelog`, which
  highlights you chose (minor/major only) and which docs links you kept.
- After the user's explicit yes, update the PR:
  `gh pr edit <number> --repo nuxt-content/docus --body-file v<version>.md`.
- Do **not** commit `v<version>.md`. It's a scratch file (ignored by `.gitignore`).

## Format notes

- Order above the changelog: Highlights → Upgrade notes → New documentation.
- Patch releases skip Highlights.
- Headers use unicode emojis (`## ✨ Highlights`), not `:shortcodes:`.
- Docs URLs drop numeric prefixes: `docs/content/en/4.ai/1.assistant.md` →
  `https://docus.dev/en/ai/assistant`.
