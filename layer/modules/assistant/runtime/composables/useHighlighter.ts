import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

let highlighter: HighlighterCore | null = null
let promise: Promise<HighlighterCore> | null = null

export const useHighlighter = async () => {
  if (!promise) {
    promise = createHighlighterCore({
      themes: [
        import('shiki/themes/material-theme-palenight.mjs'),
        import('shiki/themes/material-theme-lighter.mjs'),
      ],
      langs: [
        import('shiki/langs/vue.mjs'),
        import('shiki/langs/javascript.mjs'),
        import('shiki/langs/typescript.mjs'),
        import('shiki/langs/css.mjs'),
        import('shiki/langs/html.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/yaml.mjs'),
        import('shiki/langs/markdown.mjs'),
        import('shiki/langs/bash.mjs'),
      ],
      engine: createJavaScriptRegexEngine(),
    })
  }
  if (!highlighter) {
    highlighter = await promise
  }

  return highlighter
}
