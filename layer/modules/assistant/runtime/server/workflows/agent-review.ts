import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { createMCPClient } from '@ai-sdk/mcp'

interface AgentReviewInput {
  owner: string
  repo: string
  branch: string
  filteredDiff: string
  model: string
  mcpUrl: string
  token: string
  webhookSecret: string
}

export async function agentReviewWorkflow({ owner, repo, branch, filteredDiff, model, mcpUrl, token, webhookSecret }: AgentReviewInput) {
  // TODO(workflow): 'use workflow'
  console.log(`[agent-review] Starting review for ${owner}/${repo} branch: ${branch}, model: ${model}`)
  console.log(`[agent-review] MCP server: ${mcpUrl}`)

  const mcpClient = await createMCPClient({
    transport: { type: 'http', url: mcpUrl, headers: { 'x-agent-review': webhookSecret } },
  })

  try {
    console.log(`[agent-review] Fetching MCP tools`)
    const tools = await mcpClient.tools()
    const toolNames = Object.keys(tools)
    console.log(`[agent-review] Tools available: ${toolNames.join(', ')}`)

    const prompt = buildReviewPrompt({ owner, repo, branch, diff: filteredDiff, token })

    console.log(`[agent-review] Running agent (diff: ${filteredDiff.length} chars)`)
    const { text, steps } = await generateText({
      model: gateway(model),
      stopWhen: ({ steps }) => steps.length >= 20,
      messages: [{ role: 'user', content: prompt }],
      tools,
    })

    const toolCallCount = steps.reduce((n, s) => n + (s.toolCalls?.length ?? 0), 0)
    console.log(`[agent-review] Done — ${steps.length} step(s), ${toolCallCount} tool call(s)`)
    if (text) console.log(`[agent-review] Agent message:\n${text}`)
  }
  finally {
    await mcpClient.close()
  }
}

function buildReviewPrompt({ owner, repo, branch, diff, token }: { owner: string, repo: string, branch: string, diff: string, token: string }): string {
  return `You are a documentation agent for a Docus documentation site. Your job is to keep the docs in sync with code changes.

You have been triggered by a pull request on ${owner}/${repo} (branch: ${branch}).

## Your workflow

1. Call \`list-pages\` to discover the existing documentation structure
2. Call \`get-page\` on pages that appear related to the diff (by topic, file name, or module name)
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
- files: array of every \`{ path, content }\` you want to write, all in one call
- message: a conventional commit message describing what changed and why (e.g. \`docs: document new \\\`useHead\\\` options added in this PR\`)

## MDC writing rules

- Use Docus components where appropriate: \`::note\`, \`::callout\`, \`::code-group\`, \`::card\`
- File paths follow the content structure: \`content/2.guide/my-feature.md\`
- Frontmatter must include at minimum: \`title\` and \`description\`

## Tone and existing content

- **Match the tone of the existing docs exactly.** Read related pages with \`get-page\` first and mirror their sentence structure, vocabulary, and level of detail.
- You may only append new content or update a specific outdated value (e.g. a renamed option, a changed default). If a section is no longer accurate you can delete it if you really think it's not needed anymore. Be careful with deletion.
- **Do not rewrite for style.** If the existing text is correct, leave it unchanged even if you would phrase it differently.
- **Always prefer updating an existing page over creating a new one.** Only create a new page for a brand-new major feature that has no related existing page at all.

## PR diff

\`\`\`diff
${diff}
\`\`\``
}
