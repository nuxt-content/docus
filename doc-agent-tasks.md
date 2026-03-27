# Specs

# Doc-Agent Integration — Task Breakdown

## Context

Docus has an existing `assistant` module at `layer/modules/assistant/`. This feature extends it with a durable AI agent triggered by GitHub webhooks on PRs: it detects missing or outdated docs, generates/updates MDC pages, and commits the result back to the PR branch.

The MCP server already exposes `list-pages` and `get-page`. We only need to add `commit-update`.

## References

* [Docus repository](<https://github.com/nuxt-content/docus>)
* [Docus documentation](<https://docus.dev/en>)
* [Workflow AI documentation](<https://useworkflow.dev/docs/ai>)
* [Workflow Nuxt getting started](<https://useworkflow.dev/docs/getting-started/nuxt>)

---

## File Structure (all new files)

```text
layer/modules/assistant/runtime/server/
├── utils/
│   └── github-auth.ts          # JWT → installation token
├── mcp/
│   ├── tools/
│   │   └── commit-update.ts    # new MCP tool
│   └── prompts/
│       └── review-pr-docs.ts   # new MCP prompt
├── workflows/
│   └── doc-agent.ts            # durable workflow
└── api/webhook/
    └── github.post.ts          # webhook endpoint
```

## Files to modify

```text
layer/package.json       — add workflow, @workflow/ai
layer/nuxt.config.ts     — add workflow/nuxt module + runtimeConfig keys
layer/modules/assistant/index.ts — add docAgent options to module schema
layer/app/app.config.ts  — add docus.ai.docAgent config block
```

---

## Tasks

### Task 1 — Foundation: config, dependencies, module options

**Files:** `layer/package.json`, `layer/nuxt.config.ts`, `layer/modules/assistant/index.ts`, `layer/app/app.config.ts`

**References:**

* [Workflow Nuxt getting started](<https://useworkflow.dev/docs/getting-started/nuxt>)

Add dependencies:

```json
"workflow": "latest",
"@workflow/ai": "latest"
```

Add to `nuxt.config.ts` modules array (alongside existing modules):

```ts
'workflow/nuxt'
```

Add to `nuxt.config.ts` runtimeConfig (match existing `assistant` block pattern):

```ts
runtimeConfig: {
  githubAppId: '',           // GITHUB_APP_ID
  githubAppPrivateKey: '',   // GITHUB_APP_PRIVATE_KEY (PEM)
  webhookSecret: '',         // GITHUB_WEBHOOK_SECRET
}
```

Add `docAgent` to the assistant module options schema in `index.ts`:

```ts
docAgent?: {
  enabled?: boolean
  mode?: 'comment' | 'commit'
  githubRepo?: string
}
```

Extend `docus.ai` in `app.config.ts`:

```ts
docus: {
  ai: {
    // ...existing options unchanged...
    docAgent: {
      enabled: false,
      mode: 'comment',       // 'comment' | 'commit'
      githubRepo: 'org/repo',
    }
  }
}
```

GitHub App permissions required: `contents: write`, `pull_requests: write`, `metadata: read`

---

### Task 2 — GitHub Auth Utility

**File:** `layer/modules/assistant/runtime/server/utils/github-auth.ts`

**References:**

* [Docus repository](<https://github.com/nuxt-content/docus>)

Signs a JWT with the GitHub App private key, exchanges it for a short-lived installation access token using `installation.id` from the webhook payload.

* Uses `runtimeConfig.githubAppId` and `runtimeConfig.githubAppPrivateKey`
* Signs a JWT valid for 10 minutes (GitHub App auth requirement)
* POSTs to `https://api.github.com/app/installations/{installationId}/access_tokens`
* Returns the short-lived `token` string
* Export: `getInstallationToken(installationId: number): Promise<string>`

---

### Task 3 — `commit-update` MCP Tool

**File:** `layer/modules/assistant/runtime/server/mcp/tools/commit-update.ts`

**References:**

* [Docus repository](<https://github.com/nuxt-content/docus>)
* [Docus documentation](<https://docus.dev/en>)

Uses `defineMcpTool` from `@nuxtjs/mcp-toolkit/server` (match pattern of existing tools in the module).

Input schema (Zod):

```ts
{
  owner: string,
  repo: string,
  branch: string,
  path: string,      // e.g. content/2.guide/my-feature.md
  content: string,   // full MDC file content
  token: string,     // installation access token
}
```

Execute function — marked `"use step"` (for workflow retries):

1. Try GET `/repos/{owner}/{repo}/contents/{path}?ref={branch}` to fetch current SHA
2. If file exists → PUT with `{ message, content: base64, sha, branch }`
3. If file doesn't exist → PUT with `{ message, content: base64, branch }` (no sha)
4. Commit message: `docs: update {path} via doc-agent`

---

### Task 4 — `review-pr-docs` MCP Prompt

**File:** `layer/modules/assistant/runtime/server/mcp/prompts/review-pr-docs.ts`

**References:**

* [Docus repository](<https://github.com/nuxt-content/docus>)
* [Docus documentation](<https://docus.dev/en>)

Uses `defineMcpPrompt` from `@nuxtjs/mcp-toolkit/server`.

Arguments:

```ts
{
  owner: string,
  repo: string,
  branch: string,
  diff: string,      // filtered PR diff (already truncated)
  token: string,
}
```

The prompt instructs Claude to:

1. Call `list-pages` to discover existing documentation
2. Call `get-page` on pages that may be related to the diff
3. Decide what to create (new page) or update (existing section)
4. Call `commit-update` for each file changed

MDC output rules:

* Use Docus components: `::note`, `::callout`, `::code-group`
* File paths follow content structure: `content/2.guide/my-feature.md`
* Never delete existing sections, only append or update
* Skip docs if the diff is only types, tests, or config files with no user-facing changes

---

### Task 5 — Durable Workflow

**File:** `layer/modules/assistant/runtime/server/workflows/doc-agent.ts`

**References:**

* [Workflow AI documentation](<https://useworkflow.dev/docs/ai>)
* [Workflow Nuxt getting started](<https://useworkflow.dev/docs/getting-started/nuxt>)

Marked `"use workflow"` at the top of the file.

Input: `{ branch: string, filteredDiff: string }`

Uses `DurableAgent` from `@workflow/ai/agent` with tools via `experimental_createMCPClient` pointed at `/mcp` (same MCP server path already used by `search.ts`).

The agent:

1. Receives the `review-pr-docs` prompt with branch + diff
2. Calls MCP tools (`list-pages`, `get-page`, `commit-update`) until done
3. `commit-update` execute is `"use step"` → automatically retried on failure

Export: `docAgentWorkflow` (named export used by the webhook handler)

---

### Task 6 — GitHub Webhook Handler

**File:** `layer/modules/assistant/runtime/server/api/webhook/github.post.ts`

**References:**

* [Docus repository](<https://github.com/nuxt-content/docus>)
* [Workflow Nuxt getting started](<https://useworkflow.dev/docs/getting-started/nuxt>)

Uses `defineEventHandler` (match pattern from `search.ts`).

Handles `pull_request` events with actions `opened` and `synchronize`.

Processing order:

1. Read raw body — verify `x-hub-signature-256` using `runtimeConfig.webhookSecret` (HMAC-SHA256). Return `401` if invalid.
2. Parse payload — extract `installation.id`, `pull_request.head.ref` (branch), `pull_request.base.sha`, `pull_request.head.sha`, `repository.owner.login`, `repository.name`
3. Call `getInstallationToken(installation.id)` → short-lived token
4. Fetch diff: `GET /repos/{owner}/{repo}/compare/{base.sha}...{head.sha}` with `Accept: application/vnd.github.v3.diff`
5. Filter diff:
   * Keep only `.ts`, `.vue`, `.js` files
   * Drop deleted files, lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`), generated files (`*.d.ts`, `dist/`)
6. Truncate to 12,000 token hard limit — log file names of any skipped files
7. Call `start(docAgentWorkflow, [{ branch, filteredDiff }])` — **do not await**
8. Return `200` immediately

> Enable Fluid Compute on the Vercel project for efficient workflow suspension/resumption.

---

## Dependency handling

Some tasks are blocked by others, while others are only related and can move in parallel.

**Blocking chain**

* Task 1 blocks all implementation tasks
* Task 2 blocks Task 6
* Task 3 blocks Task 4 and Task 5
* Task 4 blocks Task 5
* Task 5 and Task 6 both block the final end-to-end wiring and validation

**Related but parallelizable work**

* Task 2 and Task 3 can run in parallel after Task 1
* Task 6 can start after Task 2, even before Task 5 is finished, as long as the workflow start can be stubbed or logged first
* Task 4 and Task 6 are related through the end-to-end flow, but Task 6 does not need to wait for Task 4 to begin

**Execution rule**

* Mark issues as `blocked by` only when another task must land first
* Mark issues as `related to` when the work should stay aligned but can proceed independently
* For testing-first delivery, prefer shipping the webhook path with a temporary stub/logging milestone before the agent side is fully connected

---

## Split suggestion

| Order | Task | Owner | Depends on | Relationship notes |
| -- | -- | -- | -- | -- |
| 1 | Task 1 — Foundation | — | — | Blocks all implementation tasks |
| 2 | Task 2 — GitHub Auth | — | Task 1 | Blocks Task 6 |
| 3 | Task 3 — `commit-update` tool | — | Task 1 | Blocks Tasks 4 and 5 |
| 4 | Task 6 — Webhook handler | — | Task 1, Task 2 | Related to Tasks 4 and 5; can start before they finish |
| 5 | Task 4 — `review-pr-docs` prompt | — | Task 3 | Blocks Task 5 |
| 6 | Task 5 — Durable workflow | — | Task 3, Task 4 | Blocks final end-to-end wiring |
| 7 | Wire webhook to workflow | — | Task 5, Task 6 | Final integration and validation step |

**Testing-first split for two people:**

* **Person A**: Tasks 1 + 2 + 6 — foundation, auth, and webhook path first so PR events can be received and the diff filtering can be tested early
* **Person B**: Tasks 3 + 4 + 5 — MCP tool, prompt, and workflow in parallel once the foundation is in place

Task 1 is still the initial blocker. After that, split the work into two tracks:

* **Track A:** Task 2 → Task 6
* **Track B:** Task 3 → Task 4 → Task 5

These tracks should stay related to each other, but only converge as blocking work at the final wiring step.

A practical milestone is to get the webhook returning `200`, verifying signatures, fetching diffs, and logging the workflow input before connecting it to the full agent execution.