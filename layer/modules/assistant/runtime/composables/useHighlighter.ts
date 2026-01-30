import { createHighlighterCore } from '@shikijs/core'
import type { HighlighterCore } from '@shikijs/core'
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript'

let highlighter: HighlighterCore | null = null
let promise: Promise<HighlighterCore> | null = null

export const useHighlighter = async () => {
  if (!promise) {
    promise = createHighlighterCore({
      langs: [
        import('@shikijs/langs/vue'),
        import('@shikijs/langs/javascript'),
        import('@shikijs/langs/typescript'),
        import('@shikijs/langs/css'),
        import('@shikijs/langs/html'),
        import('@shikijs/langs/json'),
        import('@shikijs/langs/yaml'),
        import('@shikijs/langs/markdown'),
        import('@shikijs/langs/bash'),
      ],
      themes: [
        import('@shikijs/themes/material-theme-palenight'),
        import('@shikijs/themes/material-theme-lighter'),
      ],
      engine: createJavaScriptRegexEngine(),
    })
  }
  if (!highlighter) {
    highlighter = await promise
  }

  return highlighter
}
