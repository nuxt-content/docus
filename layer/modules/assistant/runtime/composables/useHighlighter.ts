import { createHighlighter } from 'shiki'
import type { HighlighterGeneric } from 'shiki'
import { createJavaScriptRegexEngine } from 'shiki/engine-javascript.mjs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let highlighter: HighlighterGeneric<any, any> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let promise: Promise<HighlighterGeneric<any, any>> | null = null

export const useHighlighter = async () => {
  if (!promise) {
    promise = createHighlighter({
      langs: ['vue', 'js', 'ts', 'css', 'html', 'json', 'yaml', 'markdown', 'bash'],
      themes: ['material-theme-palenight', 'material-theme-lighter'],
      engine: createJavaScriptRegexEngine(),
    })
  }
  if (!highlighter) {
    highlighter = await promise
  }

  return highlighter
}
