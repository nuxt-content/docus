import { agentDiscoveryOpenApi, getAgentSiteUrl } from '#agent-discovery'

/**
 * The routes an agent can call on a Docus site: the markdown twin of every
 * page, the discovery documents and the MCP endpoint, described by the module
 * from the same route config that serves them.
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const discovery = agentDiscoveryOpenApi(event)
  const siteName = config.public.agentDiscovery?.siteName || 'Documentation'

  return {
    openapi: '3.1.0',
    info: {
      title: siteName,
      description: `Markdown representations of every ${siteName} page, the documents agents discover the site through, and its MCP endpoint.`,
      version: (config.public.docus as { version?: string } | undefined)?.version || '0.0.0',
    },
    servers: [{ url: getAgentSiteUrl(event) }],
    tags: discovery.tags,
    paths: discovery.paths,
    components: discovery.components,
  }
})
