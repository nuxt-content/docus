import { streamText, convertToModelMessages } from 'ai'

/**
 * Built-in assistant endpoint, resolving its model through the Vercel AI Gateway.
 *
 * This is also the reference implementation: to use another provider, copy it
 * into your own route at `docus.assistant.apiPath` and swap the `model`.
 */
export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)
  const config = useRuntimeConfig()

  return createAssistantResponse(streamText({
    ...await getAssistantDefaultOptions(event),
    model: config.assistant.model,
    // Gateway specific, so it stays out of the shared defaults.
    providerOptions: { gateway: { caching: 'auto' } },
    messages: await convertToModelMessages(messages),
  }))
})
