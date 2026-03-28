// TODO(workflow): import { start } from 'workflow/api'
import { agentReviewWorkflow } from '../../workflows/agent-review'
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

  // Skip events triggered by bots (e.g. the agent itself committing back to the PR branch)
  if (payload.sender?.type === 'Bot') {
    console.log(`[agent-review] Skipping bot-triggered event (sender: ${payload.sender.login})`)
    return { ok: true }
  }

  const { installation, pull_request, repository } = payload

  if (pull_request.base.ref !== repository.default_branch) return { ok: true }
  const owner: string = repository.owner.login
  const repo: string = repository.name
  const branch: string = pull_request.head.ref
  const baseSha: string = pull_request.base.sha
  const headSha: string = pull_request.head.sha

  const token = await getInstallationToken(installation.id)

  const rawDiff = await fetchPrDiff(owner, repo, baseSha, headSha, token)

  const filteredDiff = filterDiff(rawDiff)

  if (!filteredDiff) {
    console.log('[agent-review] No relevant files in diff, skipping')
    return { ok: true }
  }

  logDiff(filteredDiff)

  const mcpPath = config.agent.mcpServer
  const isExternalUrl = mcpPath.startsWith('http://') || mcpPath.startsWith('https://')
  const baseURL = (config.app?.baseURL as string | undefined)?.replace(/\/$/, '') || ''
  const mcpUrl = isExternalUrl
    ? mcpPath
    : import.meta.dev
      ? `http://localhost:3000${baseURL}${mcpPath}`
      : `${getRequestURL(event).origin}${baseURL}${mcpPath}`

  // Return immediately so GitHub doesn't retry the delivery — agent runs in the background
  // TODO(workflow): replace with start(agentReviewWorkflow, [...]) for durable execution
  event.waitUntil(
    agentReviewWorkflow({ owner, repo, branch, filteredDiff, model: config.agent.model, mcpUrl, token, webhookSecret: config.webhookSecret })
      .catch(err => console.error('[agent-review] Workflow failed:', err)),
  )

  return { ok: true }
})
