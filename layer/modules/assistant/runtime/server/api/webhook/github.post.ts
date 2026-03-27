export default defineEventHandler(async (event) => {
  const payload = await readBody(event)

  const action = payload?.action
  const repo = payload?.repository?.full_name
  const pr = payload?.pull_request?.number

  console.log(`[doc-agent] webhook received — action: ${action}, repo: ${repo}, PR: #${pr}`)

  return { ok: true }
})
