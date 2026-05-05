/**
 * Shared client-side error reporter for the assistant.
 *
 * Uses evlog's `parseError` to extract the structured fields a server may have
 * attached (`message`, `status`, `why`, `fix`, `link`), forwards a wide event
 * via the client `log` API, and surfaces a toast.
 *
 * Returns `{ report }` that components call from their `Chat` `onError` hook.
 */
import { parseError } from 'evlog'
import { log } from 'evlog/client'
import type { Toast } from '@nuxt/ui/runtime/composables/useToast.js'

interface ReportOptions {
  /** Surface a toast notification. Defaults to `true`. */
  toast?: boolean
  /** Logical action that triggered the error. Stored as `action`. */
  action?: string
}

export function useAssistantErrorReporter() {
  const toast = useToast() as { add: (toast: Partial<Toast>) => void }

  function report(error: Error, options: ReportOptions = {}) {
    const parsed = parseError(error)
    const { toast: showToast = true, action = 'assistant.chat' } = options

    log.error({
      action,
      message: parsed.message,
      assistant: {
        status: parsed.status,
        why: parsed.why,
      },
      stack: error.stack,
    })

    if (showToast) {
      const description = parsed.fix
        ? `${parsed.message} — ${parsed.fix}`
        : parsed.message

      toast.add({
        description,
        icon: 'i-lucide-alert-circle',
        color: 'error',
        duration: 0,
      })
    }

    return parsed
  }

  return { report }
}
