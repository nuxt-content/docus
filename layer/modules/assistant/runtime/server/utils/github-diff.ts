// ~12 000 tokens at 4 chars/token
const TOKEN_CHAR_LIMIT = 48_000

const KEEP_EXTENSIONS = /\.(?:ts|vue|js)$/
const DROP_PATTERNS = /package-lock\.json|pnpm-lock\.yaml|yarn\.lock|\.d\.ts$|\/dist\//

export function filterDiff(rawDiff: string): string {
  const chunks = rawDiff.split(/(?=^diff --git )/m)
  const kept: string[] = []
  const skipped: string[] = []
  let totalChars = 0

  for (const chunk of chunks) {
    if (!chunk.startsWith('diff --git ')) continue

    const pathMatch = chunk.match(/^diff --git a\/.+ b\/(.+)$/m)
    const filePath = pathMatch?.[1] ?? ''

    if (!KEEP_EXTENSIONS.test(filePath) || DROP_PATTERNS.test(filePath) || /^deleted file mode/m.test(chunk)) {
      skipped.push(filePath)
      continue
    }

    if (totalChars + chunk.length > TOKEN_CHAR_LIMIT) {
      skipped.push(filePath)
      continue
    }

    kept.push(chunk)
    totalChars += chunk.length
  }

  if (skipped.length > 0)
    console.warn(`[doc-agent] Skipped files: ${skipped.filter(Boolean).join(', ')}`)

  return kept.join('')
}

export function logDiff(filteredDiff: string): void {
  const chunks = filteredDiff.split(/(?=^diff --git )/m).filter(c => c.startsWith('diff --git '))

  const files = chunks.map((chunk) => {
    const pathMatch = chunk.match(/^diff --git a\/.+ b\/(.+)$/m)
    const filePath = pathMatch?.[1] ?? '?'
    const added = (chunk.match(/^\+(?!\+\+)/mg) ?? []).length
    const removed = (chunk.match(/^-(?!--)/mg) ?? []).length
    return { filePath, added, removed }
  })

  const totalAdded = files.reduce((s, f) => s + f.added, 0)
  const totalRemoved = files.reduce((s, f) => s + f.removed, 0)

  console.log(`[doc-agent] Diff: ${files.length} file(s)  +${totalAdded} -${totalRemoved}`)
  for (const { filePath, added, removed } of files)
    console.log(`  ${filePath}  +${added} -${removed}`)
}

export async function fetchPrDiff(owner: string, repo: string, baseSha: string, headSha: string, token: string): Promise<string> {
  return $fetch<string>(
    `https://api.github.com/repos/${owner}/${repo}/compare/${baseSha}...${headSha}`,
    {
      responseType: 'text',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3.diff',
        'User-Agent': 'docus-doc-agent',
      },
    },
  )
}
