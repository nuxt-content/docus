import { resolve } from 'path'

const r = path => resolve(__dirname, path)

export default {
  alias: {
    qrcode: r('mock/default'),
    axios: r('mock/default'),
    nprogress: r('mock/default'),
    jwt_decode: r('mock/default')
  },
  target: 'static',
  ssr: true,
  privateRuntimeConfig: {
    githubToken: process.env.GITHUB_TOKEN
  },
  head: {
    meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    link: [
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
      },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com' }
    ]
  },
  generate: {
    fallback: '404.html',
    routes: ['/']
  },
  build: {
    transpile: ['docus']
  },
  css: ['@docus/theme/src/css/main.css'],
  plugins: [r('plugins/menu')],
  buildModules: [
    r('module'),
    'nuxt-vite',
    '@nuxtjs/composition-api',
    '@nuxt/typescript-build',
    'nuxt-windicss',
    '@nuxtjs/color-mode',
    '@nuxtjs/pwa',
    '@docus/social-image',
    '@docus/twitter'
  ],
  modules: ['@docus/i18n', '@docus/core'],
  components: true,
  loading: {
    color: 'var(--primary-500)'
  },
  meta: {
    /**
     * Default theme color
     * Will override by docus primary color
     */
    theme_color: '#06B6D4'
  },
  colorMode: {
    classSuffix: ''
  },
  server: {
    port: process.env.PORT || 4000
  },
  vite: {
    optimizeDeps: {
      exclude: ['ohmyfetch', 'vue-demi', 'scule', '@vueuse/integrations'],
      include: ['defu', 'theme-colors', 'lodash.groupby']
    },
    vue: {}
  }
}
