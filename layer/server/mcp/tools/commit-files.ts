import { z } from 'zod'

const ALLOWED_EXTENSIONS = /\.(?:md|mdx|mdc)$/
const MAX_CONTENT_SIZE = 500 * 1024 // 500 KB per file
const PROTECTED_BRANCH_PATTERNS = [
  /^main$/,
  /^master$/,
  /^release\//,
  /^hotfix\//,
]

export default defineMcpTool({
  description: 'Commits one or more documentation files to a GitHub branch in a single atomic commit using the Git Trees API.',
  enabled: (event) => {
    const config = useRuntimeConfig(event)
    return getHeader(event, 'x-agent-review') === config.webhookSecret
  },
  inputSchema: {
    owner: z.string().describe('GitHub repository owner'),
    repo: z.string().describe('GitHub repository name'),
    branch: z.string().describe('Branch to commit to (must be the PR head branch, never the default branch)'),
    token: z.string().describe('GitHub installation access token'),
    files: z.array(z.object({
      path: z.string().describe('File path relative to repo root (e.g. content/2.guide/my-feature.md)'),
      content: z.string().describe('Full file content to write'),
    })).min(1).describe('Array of files to create or update in a single commit'),
    message: z.string().describe('Commit message. Use conventional commits format: "docs: <what changed and why>" — be specific about what was added or updated (e.g. "docs: document new `useHead` options added in PR #42")'),
  },
  handler: async ({ owner, repo, branch, token, files, message }: {
    owner: string
    repo: string
    branch: string
    token: string
    files: Array<{ path: string, content: string }>
    message: string
  }) => {
    const appConfig = useAppConfig() as { github?: { rootDir?: string } }
    const contentRepoBase = appConfig.github?.rootDir
      ? `${appConfig.github.rootDir}/content`
      : 'content'

    console.log(`[commit-files] Preparing commit: ${owner}/${repo} branch=${branch} files=${files.length} contentRepoBase=${contentRepoBase}`)

    // --- Security guards ---

    // 1. Reject protected branch patterns
    for (const pattern of PROTECTED_BRANCH_PATTERNS) {
      if (pattern.test(branch)) {
        console.warn(`[commit-files] Rejected: branch "${branch}" matches protected pattern ${pattern}`)
        return errorResult(`Refusing to commit to protected branch: ${branch}`)
      }
    }

    const githubHeaders = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    }

    // 2. Verify branch exists and is not the default branch
    let defaultBranch: string
    let branchSha: string
    try {
      const repoInfo = await $fetch<{ default_branch: string }>(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: githubHeaders,
      })
      defaultBranch = repoInfo.default_branch
      console.log(`[commit-files] Default branch: ${defaultBranch}`)

      if (branch === defaultBranch) {
        console.warn(`[commit-files] Rejected: branch "${branch}" is the default branch`)
        return errorResult(`Refusing to commit directly to the default branch: ${branch}`)
      }

      const branchInfo = await $fetch<{ commit: { sha: string } }>(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`, {
        headers: githubHeaders,
      })
      branchSha = branchInfo.commit.sha
      console.log(`[commit-files] Branch HEAD: ${branchSha}`)
    }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[commit-files] Failed to fetch repo/branch info: ${msg}`)
      return errorResult(`Failed to fetch repo or branch info: ${msg}`)
    }

    // 3. Validate each file
    for (const file of files) {
      // Path traversal
      if (file.path.includes('..') || file.path.startsWith('/')) {
        console.warn(`[commit-files] Rejected: invalid path "${file.path}"`)
        return errorResult(`Invalid file path: ${file.path}`)
      }

      // Must live under the content directory
      if (!file.path.startsWith(`${contentRepoBase}/`)) {
        console.warn(`[commit-files] Rejected: path outside ${contentRepoBase}/: "${file.path}"`)
        return errorResult(`File path must start with "${contentRepoBase}/": ${file.path}`)
      }

      // Markdown-only
      if (!ALLOWED_EXTENSIONS.test(file.path)) {
        console.warn(`[commit-files] Rejected: non-markdown extension "${file.path}"`)
        return errorResult(`Only .md, .mdx, and .mdc files are allowed: ${file.path}`)
      }

      // Size limit
      const byteSize = Buffer.byteLength(file.content, 'utf8')
      if (byteSize > MAX_CONTENT_SIZE) {
        console.warn(`[commit-files] Rejected: file "${file.path}" exceeds size limit (${byteSize} bytes)`)
        return errorResult(`File exceeds 500 KB limit: ${file.path} (${byteSize} bytes)`)
      }

      console.log(`[commit-files] Validated: ${file.path} (${byteSize} bytes)`)
    }

    // --- Git Trees API ---

    // 4. Get the current tree SHA
    let baseTreeSha: string
    try {
      const commitInfo = await $fetch<{ tree: { sha: string } }>(`https://api.github.com/repos/${owner}/${repo}/git/commits/${branchSha}`, {
        headers: githubHeaders,
      })
      baseTreeSha = commitInfo.tree.sha
      console.log(`[commit-files] Base tree SHA: ${baseTreeSha}`)
    }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[commit-files] Failed to fetch commit tree: ${msg}`)
      return errorResult(`Failed to fetch commit tree: ${msg}`)
    }

    // 5. Create a new tree with all files
    let newTreeSha: string
    try {
      const treePayload = {
        base_tree: baseTreeSha,
        tree: files.map(file => ({
          path: file.path,
          mode: '100644',
          type: 'blob',
          content: file.content,
        })),
      }
      const newTree = await $fetch<{ sha: string }>(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        headers: githubHeaders,
        body: JSON.stringify(treePayload),
      })
      newTreeSha = newTree.sha
      console.log(`[commit-files] New tree SHA: ${newTreeSha}`)
    }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[commit-files] Failed to create tree: ${msg}`)
      return errorResult(`Failed to create Git tree: ${msg}`)
    }

    // 6. Create the commit
    let newCommitSha: string
    try {
      const newCommit = await $fetch<{ sha: string }>(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        headers: githubHeaders,
        body: JSON.stringify({
          message,
          tree: newTreeSha,
          parents: [branchSha],
        }),
      })
      newCommitSha = newCommit.sha
      console.log(`[commit-files] New commit SHA: ${newCommitSha}`)
    }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[commit-files] Failed to create commit: ${msg}`)
      return errorResult(`Failed to create commit: ${msg}`)
    }

    // 7. Update the branch ref
    try {
      await $fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        headers: githubHeaders,
        body: JSON.stringify({ sha: newCommitSha }),
      })
      console.log(`[commit-files] Branch "${branch}" updated to ${newCommitSha}`)
    }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[commit-files] Failed to update ref: ${msg}`)
      return errorResult(`Failed to update branch ref: ${msg}`)
    }

    const paths = files.map(f => f.path).join(', ')
    console.log(`[commit-files] Done — committed ${files.length} file(s) to ${branch}: ${paths}`)

    return jsonResult({
      sha: newCommitSha,
      branch,
      files: files.map(f => f.path),
    })
  },
})
