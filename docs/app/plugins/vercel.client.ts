import { inject, pageview } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'

export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp()
  const route = useRoute()
  const speedInsights = injectSpeedInsights({
    route: route.matched[0]?.path || route.path,
    framework: 'nuxt',
  })

  onNuxtReady(() => {
    inject({
      disableAutoTrack: true,
      framework: 'nuxt',
    })
  })
  // On navigation to a new page
  nuxtApp.hooks.hook('page:finish', () => {
    pageview({
      route: route.matched[0]?.path || route.path,
      path: route.path,
    })
    speedInsights?.setRoute(route.matched[0]?.path || route.path)
  })
})