import { streamText, convertToModelMessages } from 'ai'
import { createMistral } from '@ai-sdk/mistral'

/**
 * Custom assistant endpoint, rebuilt on Mistral instead of the Vercel AI Gateway.
 */

// Reads MISTRAL_API_KEY from the environment.
const mistral = createMistral()

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)
  const defaults = await getAssistantDefaultOptions(event)

  return createAssistantResponse(streamText({
    ...defaults,
    model: mistral('mistral-small-latest'),

    // Mistral rejects the 8000 the built-in endpoint uses.
    maxOutputTokens: 4000,
    temperature: 0.3,

    // Extend the default prompt instead of replacing it.
    instructions: `${defaults.instructions}

**Playground rules:**
- Mention that answers come from the Docus playground running on Mistral
- Keep answers under five bullet points`,

    messages: await convertToModelMessages(messages),
  }))
})
