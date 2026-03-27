import { addComponent, addImports, addServerHandler, createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { getGitEnv, getLocalGitInfo } from '../../utils/git'

export interface DocusModuleOptions {
  agent?: {
    /**
     * AI model to use via AI SDK Gateway
     * @default 'google/gemini-3-flash'
     */
    model?: string
    /**
     * MCP server URL or path.
     * - Use a path like '/mcp' to use the built-in Docus MCP server
     * - Use a full URL like 'https://docs.example.com/mcp' for external MCP servers
     * @default '/mcp'
     */
    mcpServer?: string
    /**
     * AI chat assistant embedded in the docs site.
     */
    chat?: {
      /**
       * Enable the chat assistant (auto-detected from AI_GATEWAY_API_KEY)
       * @default true
       */
      enabled?: boolean
      /**
       * API endpoint path for the chat assistant
       * @default '/__docus__/assistant'
       */
      apiPath?: string
    }
    /**
     * PR documentation review agent triggered by GitHub webhooks.
     */
    review?: {
      /**
       * Enable the webhook handler
       * @default false
       */
      enabled?: boolean
      /**
       * Whether the agent posts a PR comment ('comment') or directly commits ('commit')
       * @default 'comment'
       */
      mode?: 'comment' | 'commit'
      /**
       * Target GitHub repository in 'org/repo' format.
       * Auto-detected from Vercel, Netlify, and GitHub Actions CI environment variables.
       */
      githubRepo?: string
    }
  }
}

const log = logger.withTag('Docus')

async function detectGithubRepo(rootDir: string): Promise<string | undefined> {
  // Local: read origin remote from .git/config
  const local = await getLocalGitInfo(rootDir)
  if (local?.owner && local?.name)
    return `${local.owner}/${local.name}`

  // CI: Vercel, Netlify, GitHub Actions, GitLab CI
  const env = getGitEnv()
  if (env.owner && env.name)
    return `${env.owner}/${env.name}`
}

export default defineNuxtModule<DocusModuleOptions>({
  meta: {
    name: 'docus:agent',
    configKey: 'docus',
  },
  defaults: {
    agent: {
      model: 'google/gemini-3-flash',
      mcpServer: '/mcp',
      chat: {
        apiPath: '/__docus__/assistant',
      },
    },
  },
  async setup(options, nuxt) {
    const agent = options.agent!
    const hasApiKey = !!process.env.AI_GATEWAY_API_KEY
    const chatEnabled = hasApiKey && (agent.chat?.enabled !== false)

    const { resolve } = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.agent = {
      chatEnabled,
      chatApiPath: agent.chat?.apiPath!,
    }

    addImports([
      {
        name: 'useAssistant',
        from: resolve('./runtime/composables/useAssistant'),
      },
    ])

    const components = [
      'AssistantChat',
      'AssistantPanel',
      'AssistantFloatingInput',
      'AssistantLoading',
      'AssistantMatrix',
    ]

    components.forEach(name =>
      addComponent({
        name,
        filePath: chatEnabled
          ? resolve(`./runtime/components/${name}.vue`)
          : resolve('./runtime/components/AssistantChatDisabled.vue'),
      }),
    )

    if (process.env.GITHUB_APP_ID)
      nuxt.options.runtimeConfig.githubAppId = process.env.GITHUB_APP_ID
    if (process.env.GITHUB_APP_PRIVATE_KEY)
      nuxt.options.runtimeConfig.githubAppPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY
    if (process.env.GITHUB_WEBHOOK_SECRET)
      nuxt.options.runtimeConfig.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET

    if (agent.review?.enabled) {
      const githubRepo = agent.review.githubRepo || await detectGithubRepo(nuxt.options.rootDir)
      if (githubRepo)
        nuxt.options.runtimeConfig.agentGithubRepo = githubRepo
      else
        log.warn('Review agent enabled but no GitHub repository detected — set docus.agent.review.githubRepo or deploy on Vercel, Netlify, or GitHub Actions')

      addServerHandler({
        route: '/__docus__/webhook/github',
        handler: resolve('./runtime/server/api/webhook/github.post'),
      })

      const webhookPath = '/__docus__/webhook/github'
      const siteUrl = process.env.NUXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
        || nuxt.options.devServer?.url?.replace(/\/$/, '')
      log.info(`GitHub webhook registered — set Webhook URL to: ${siteUrl ? `${siteUrl}${webhookPath}` : webhookPath}`)
    }

    if (!hasApiKey) {
      log.warn('AI agent disabled: AI_GATEWAY_API_KEY not found')
      return
    }

    nuxt.options.runtimeConfig.agent = {
      mcpServer: agent.mcpServer!,
      model: agent.model!,
    }

    const routePath = agent.chat?.apiPath!.replace(/^\//, '')
    addServerHandler({
      route: `/${routePath}`,
      handler: resolve('./runtime/server/api/search'),
    })
  },
})

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    agent: {
      chatEnabled: boolean
      chatApiPath: string
    }
  }
  interface RuntimeConfig {
    githubAppId: string
    githubAppPrivateKey: string
    webhookSecret: string
    agentGithubRepo: string
    agent: {
      mcpServer: string
      model: string
    }
  }
}
