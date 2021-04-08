import Vue from 'vue'
import groupBy from 'lodash.groupby'
import { $fetch } from 'ohmyfetch'
import { joinURL, withoutTrailingSlash, withTrailingSlash } from 'ufo'
import { useColors, useDefaults } from '../utils/settings'

export default async function ({ app, ssrContext, $content, $config, nuxtState = {}, beforeNuxtRender }, inject) {
  const $docus = new Vue({
    data () {
      return nuxtState.docus || {
        page: {},
        categories: {},
        lastRelease: null,
        settings: null
      }
    },
    computed: {
      repoUrl () {
        return joinURL(this.settings.github.url, this.settings.github.repo)
      },
      previewUrl () {
        return withoutTrailingSlash(this.settings.url) + '/preview.png'
      },
      themeStyles () {
        const colors = useColors(this.settings.colors)
        const styles = colors.map(([color, map]) => {
          return Object.entries(map).map(([variant, value]) => {
            return `--${color}-${variant}: ${value};`
          }).join('')
        }).join('')
        return `:root {${styles}}`
      }
    },
    methods: {
      async fetch () {
        await this.fetchSettings()
        await Promise.all([
          this.fetchCategories(),
          this.fetchLastRelease()
        ])
      },

      async fetchSettings () {
        const { path, extension, ...settings } = await $content('settings').only(['title', 'url', 'logo', 'template', 'header', 'twitter', 'github', 'algolia', 'colors', 'credits']).fetch().catch((e) => {
          // eslint-disable-next-line no-console
          console.warn('Please add a `settings.json` file inside the `content/` folder to customize this theme.')
        })
        this.settings = useDefaults(settings)
        // Update injected styles on HMR
        if (process.dev && process.client && window.$nuxt) {
          this.updateHead()
        }
      },

      async fetchCategories () {
        // Avoid re-fetching in production
        if (process.dev === false && this.categories[app.i18n.locale]) {
          return
        }
        const draft = this.ui?.draft ? undefined : false
        const fields = ['title', 'menuTitle', 'category', 'slug', 'version', 'to', 'icon']
        if (process.dev) {
          fields.push('draft')
        }
        const docs = await $content({ deep: true })
          .where({ language: app.i18n.locale, draft, menu: { $ne: false } })
          .only(fields)
          .sortBy('position', 'asc')
          .fetch()

        if (this.settings.github.releases) {
          docs.push({ slug: 'releases', title: 'Releases', category: 'Community', to: '/releases' })
        }
        this.$set(this.categories, app.i18n.locale, groupBy(docs, 'category'))
      },

      fetchReleases () {
        if (process.server) {
          return ssrContext.docus.releases
        }
        return $fetch('/api/docus/releases')
      },

      async fetchLastRelease () {
        if (process.dev === false && this.lastRelease) {
          return
        }
        const [lastRelease] = await this.fetchReleases()
        if (lastRelease) {
          this.lastRelease = lastRelease.name
        }
      },

      updateHead () {
        // Update when editing content/settings.json
        if (process.dev && process.client && window.$nuxt) {
          const style = window.$nuxt.$options.head.style.find(s => s.hid === 'docus-theme')
          if (style) {
            style.cssText = this.themeStyles
            window.$nuxt.$meta().refresh()
          }
          return
        }
        // Add head keys
        if (!Array.isArray(app.head.style)) {
          app.head.style = []
        }
        if (!Array.isArray(app.head.meta)) {
          app.head.meta = []
        }
        app.head.style.push({
          hid: 'docus-theme',
          cssText: this.themeStyles,
          type: 'text/css'
        })

        app.head.meta = app.head.meta.filter(s => s.hid !== 'apple-mobile-web-app-title')
        app.head.meta.push({ hid: 'apple-mobile-web-app-title', name: 'apple-mobile-web-app-title', content: this.settings.title })
        app.head.meta = app.head.meta.filter(s => s.hid !== 'theme-color')
        app.head.meta.push({ hid: 'theme-color', name: 'theme-color', content: this.settings.colors.primary })
      },

      isLinkActive (path) {
        return withTrailingSlash(app.router.path) === withTrailingSlash(app.$contentLocalePath(path))
      }
    }
  })

  if (process.server) {
    await $docus.fetch()
    beforeNuxtRender(({ nuxtState }) => {
      nuxtState.docus = $docus.$data
    })
  }
  // Spa Fallback
  if (process.client && !$docus.settings) {
    await $docus.fetch()
  }
  // Hot reload on development
  if (process.client && process.dev) {
    window.onNuxtReady(() => {
      window.$nuxt.$on('content:update', () => $docus.fetch())
    })
  }

  // Workaround for Nuxt 2 using async layout inside the page
  // https://github.com/nuxt/nuxt.js/issues/3510#issuecomment-736757419
  if (process.client) {
    window.onNuxtReady((nuxt) => {
    // Workaround since in full static mode, asyncData is not called anymore
      app.router.beforeEach(async (to, from, next) => {
        const payload = nuxt._pagePayload || {}
        payload.data = payload.data || []
        if (payload.data[0]?.page?.template && typeof Vue.component(payload.data[0].page.template) === 'function') {
          // Preload the component on client-side navigation
          await Vue.component(payload.data[0].page.template)()
        }
        next()
      })
    })
  }

  // Update app head, Inject colors as css variables
  $docus.updateHead()

  inject('docus', $docus)
}
