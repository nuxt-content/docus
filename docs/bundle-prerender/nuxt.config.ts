// The pages the bundle size workflows prerender with `--prerender --extends ./bundle-prerender`.
// Besides the landing page, they load the heaviest lazy prose components, such as images and code trees.
// English only, as the French pages load the same files.
const urls = [
  '/en',
  '/en/getting-started/installation',
  '/en/essentials/components',
  '/en/essentials/code-blocks',
  '/en/essentials/images-embeds',
]

export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: urls,
      // Also leaves out the links Nitro crawls and the routes the layer adds.
      ignore: [(path: string) => !urls.includes(path)],
    },
  },
})
