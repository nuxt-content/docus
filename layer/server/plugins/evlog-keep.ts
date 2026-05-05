/**
 * Tail sampling: force-keep events that matter regardless of any sampling
 * configured by the consumer.
 *
 *  - Errors (status >= 400)
 *  - Slow requests (> 2s)
 *  - MCP and assistant routes (low traffic, high signal)
 *
 * This runs *after* head sampling decisions, so even with aggressive `info`
 * rate limits in `evlog.sampling.rates`, these stay in the drain.
 */
import type { TailSamplingContext } from 'evlog'

const SLOW_REQUEST_MS = 2_000
const HIGH_SIGNAL_PATHS = ['/mcp', '/__docus__/']

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('evlog:emit:keep', (ctx: TailSamplingContext) => {
    if (ctx.status && ctx.status >= 400) {
      ctx.shouldKeep = true
      return
    }

    if (ctx.duration && ctx.duration > SLOW_REQUEST_MS) {
      ctx.shouldKeep = true
      return
    }

    if (ctx.path && HIGH_SIGNAL_PATHS.some(prefix => ctx.path!.startsWith(prefix))) {
      ctx.shouldKeep = true
    }
  })
})
