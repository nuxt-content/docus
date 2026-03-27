import { z } from 'zod'

export default defineMcpPrompt({
  enabled: (event: import('h3').H3Event) => {
    const config = useRuntimeConfig(event)
    return getHeader(event, 'x-agent-review') === config.webhookSecret
  },
  name: 'review-pr-docs',
  description: 'Reviews a PR diff and updates the Docus documentation site accordingly. Discovers existing pages, identifies gaps, then creates or updates MDC files directly on the PR branch.',
  inputSchema: {
    owner: z.string().describe('GitHub repository owner'),
    repo: z.string().describe('GitHub repository name'),
    branch: z.string().describe('PR head branch to commit documentation updates to'),
    diff: z.string().describe('Filtered PR diff (only .ts/.vue/.js files, already truncated)'),
    token: z.string().describe('GitHub installation access token for committing changes'),
  },
  handler: ({ owner, repo, branch, diff, token }: { owner: string, repo: string, branch: string, diff: string, token: string }) => {
    return `You are a documentation agent for a Docus documentation site. Your job is to keep the docs in sync with code changes.

You have been triggered by a pull request on ${owner}/${repo} (branch: ${branch}).

## Your workflow

1. Call \`list-pages\` to discover the existing documentation structure — it returns a \`filePath\` field for each page (the actual path in the repository to use with \`commit-files\`)
2. Call \`get-page\` on pages that appear related to the diff (by topic, file name, or module name) — it also returns \`filePath\`
3. Decide what documentation action to take for each relevant file:
   - **Existing page that is now outdated** → update the relevant section(s) in place — **this is always the preferred action**
   - **Brand-new major feature with absolutely no existing page** → only then create a new MDC page
   - **Only internal refactor / types / tests / config** → skip, no docs needed
   - When in doubt, update an existing page rather than creating a new one
4. Call \`commit-files\` **ONCE** with ALL files to create or update — do not call it multiple times

## Commit parameters

Always pass these exact values to \`commit-files\`:
- owner: "${owner}"
- repo: "${repo}"
- branch: "${branch}"
- token: "${token}"
- files: array of every \`{ path, content }\` you want to write, all in one call — use the \`filePath\` value from \`list-pages\`/\`get-page\` for existing files; for new files, follow the exact same directory pattern
- message: a conventional commit message describing what changed and why (e.g. \`docs: document new \\\`useHead\\\` options added in this PR\`)

## MDC writing rules

- Use Docus components where appropriate: \`::note\`, \`::callout\`, \`::code-group\`, \`::card\`
- File paths follow the content structure: \`content/2.guide/my-feature.md\`
- Frontmatter must include at minimum: \`title\` and \`description\`

## Tone and existing content

- **Match the tone of the existing docs exactly.** Read related pages with \`get-page\` first and mirror their sentence structure, vocabulary, and level of detail.
- **Never remove or shorten existing sections.** You may only append new content or update a specific outdated value (e.g. a renamed option, a changed default). If a section is no longer accurate, add a note below it — do not delete it.
- **Do not rewrite for style.** If the existing text is correct, leave it unchanged even if you would phrase it differently.
- **Always prefer updating an existing page over creating a new one.** Only create a new page for a brand-new major feature that has no related existing page at all.

## PR diff

\`\`\`diff
${diff}
\`\`\``
  },
})
