/**
 * Adds context enrichers to every emitted wide event:
 *  - user-agent     parsed browser/os/device fields
 *  - request size   body length on writes
 *  - geo            country/region from CDN headers when present
 *
 * Runs after the handler resolves and before the drain executes, so
 * downstream consumers (Axiom, OTLP, Sentry…) see fully enriched events.
 */
import {
  createUserAgentEnricher,
  createRequestSizeEnricher,
  createGeoEnricher,
} from 'evlog/enrichers'

const enrichers = [
  createUserAgentEnricher(),
  createRequestSizeEnricher(),
  createGeoEnricher(),
]

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('evlog:enrich', (ctx) => {
    for (const enricher of enrichers) enricher(ctx)
  })
})
