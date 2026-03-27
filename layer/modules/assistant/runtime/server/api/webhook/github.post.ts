import { getInstallationToken } from '../../utils/github-auth'
import { fetchPrDiff, filterDiff, logDiff } from '../../utils/github-diff'
import { verifyWebhookSignature } from '../../utils/github-webhook'

export default defineEventHandler(async (event) => {
  const githubEvent = getHeader(event, 'x-github-event')
  if (githubEvent !== 'pull_request') return { ok: true }

  const config = useRuntimeConfig()

  const rawBody = await readRawBody(event, false)
  if (!rawBody) return sendError(event, createError({ statusCode: 400 }))

  const signature = getHeader(event, 'x-hub-signature-256') ?? ''
  if (!verifyWebhookSignature(config.webhookSecret, rawBody, signature))
    return sendError(event, createError({ statusCode: 401, message: 'Invalid signature' }))

  const payload = JSON.parse(rawBody.toString('utf8'))

  if (!['opened', 'reopened', 'synchronize'].includes(payload.action)) return { ok: true }

  const { installation, pull_request, repository } = payload

  if (pull_request.base.ref !== repository.default_branch) return { ok: true }
  const owner: string = repository.owner.login
  const repo: string = repository.name
  const _branch: string = pull_request.head.ref
  const baseSha: string = pull_request.base.sha
  const headSha: string = pull_request.head.sha

  const token = await getInstallationToken(installation.id)

  const rawDiff = await fetchPrDiff(owner, repo, baseSha, headSha, token)

  const filteredDiff = filterDiff(rawDiff)

  if (!filteredDiff) {
    console.log('[doc-agent] No relevant files in diff, skipping')
    return { ok: true }
  }

  logDiff(filteredDiff)
  // TODO Task 5: start(docAgentWorkflow, [{ branch, filteredDiff }])

  return { ok: true }
})
