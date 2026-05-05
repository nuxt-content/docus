/**
 * Auto-wires an evlog drain based on which observability env var is present.
 *
 * Detection order (first match wins):
 *  - NUXT_AXIOM_TOKEN          → Axiom
 *  - NUXT_OTLP_ENDPOINT / OTEL_EXPORTER_OTLP_ENDPOINT → OTLP
 *  - NUXT_SENTRY_DSN           → Sentry
 *  - NUXT_DD_API_KEY           → Datadog
 *  - NUXT_HYPERDX_API_KEY      → HyperDX
 *  - NUXT_BETTER_STACK_SOURCE_TOKEN → Better Stack
 *  - NUXT_POSTHOG_API_KEY      → PostHog
 *
 * Falls back to a no-op when none is configured. Consumers can also register
 * their own drain via `nitroApp.hooks.hook('evlog:drain', drain)` from another
 * plugin — multiple drains compose freely.
 *
 * Drains are wrapped in `createDrainPipeline` so they batch and retry on
 * transient failures instead of blocking the response.
 */
import { createDrainPipeline } from 'evlog/pipeline'
import type { PipelineDrainFn } from 'evlog/pipeline'
import type { DrainContext } from 'evlog'

type RawDrain = (ctx: DrainContext | DrainContext[]) => void | Promise<void>

const wrap = createDrainPipeline<DrainContext>({
  batch: { size: 50, intervalMs: 5_000 },
})

function pipelined(adapter: RawDrain): PipelineDrainFn<DrainContext> {
  return wrap(async (batch) => {
    await adapter(batch)
  })
}

async function resolveDrain(): Promise<PipelineDrainFn<DrainContext> | null> {
  const env = process.env

  if (env.NUXT_AXIOM_TOKEN || env.AXIOM_TOKEN || env.NUXT_AXIOM_API_KEY || env.AXIOM_API_KEY) {
    const { createAxiomDrain } = await import('evlog/axiom')
    return pipelined(createAxiomDrain())
  }

  if (env.NUXT_OTLP_ENDPOINT || env.OTEL_EXPORTER_OTLP_ENDPOINT || env.OTLP_ENDPOINT) {
    const { createOTLPDrain } = await import('evlog/otlp')
    return pipelined(createOTLPDrain())
  }

  if (env.NUXT_SENTRY_DSN || env.SENTRY_DSN) {
    const { createSentryDrain } = await import('evlog/sentry')
    return pipelined(createSentryDrain())
  }

  if (env.NUXT_DD_API_KEY || env.DD_API_KEY || env.DATADOG_API_KEY) {
    const { createDatadogDrain } = await import('evlog/datadog')
    return pipelined(createDatadogDrain())
  }

  if (env.NUXT_HYPERDX_API_KEY || env.HYPERDX_API_KEY) {
    const { createHyperDXDrain } = await import('evlog/hyperdx')
    return pipelined(createHyperDXDrain())
  }

  if (env.NUXT_BETTER_STACK_SOURCE_TOKEN || env.BETTER_STACK_SOURCE_TOKEN) {
    const { createBetterStackDrain } = await import('evlog/better-stack')
    return pipelined(createBetterStackDrain())
  }

  if (env.NUXT_POSTHOG_API_KEY || env.POSTHOG_API_KEY) {
    const { createPostHogDrain } = await import('evlog/posthog')
    return pipelined(createPostHogDrain())
  }

  return null
}

export default defineNitroPlugin(async (nitroApp) => {
  if (import.meta.prerender) return

  const drain = await resolveDrain()
  if (!drain) return

  nitroApp.hooks.hook('evlog:drain', drain)

  nitroApp.hooks.hook('close', async () => {
    await drain.flush()
  })
})
