// The pages the bundle size workflows prerender with `--prerender --extends ./bundle-prerender`,
// to measure what their HTML preloads: the landing page and two docs pages, in English only, as
// the French pages load the same files.
const urls = ['/en', '/en/getting-started/installation', '/en/essentials/components']

export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: urls,
      // Also leaves out the links Nitro crawls and the routes the layer adds.
      ignore: [(path: string) => !urls.includes(path)],
    },
  },
})
