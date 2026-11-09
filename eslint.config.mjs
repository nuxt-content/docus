import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  dirs: {
    src: [
      './layer',
      './docs',
    ],
  },
  features: {
    tooling: true,
    stylistic: true,
  },
}, {
  files: [
    'cli/**/*.ts',
  ],
}).append(
  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)
