import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNitroConfig({
  extends: ['@nuxt-themes/typography', ],

  modules: [
    '@nuxthq/studio',
    'pinceau/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxt/image',
    '@nuxt/devtools',
    '@nuxtjs/google-fonts',
    'nuxt-icon',
    '@nuxtjs/plausible',
    '@nuxt/content',

    resolve('./app/module')
  ],

  css: [
    resolve('./assets/css/main.css')
  ],

  components: [
    {
      prefix: '',
      "dirs": [],
      path: resolve('./components/app'),
      global: true
    },
    {
      prefix: '',
      path: resolve('./components/docs'),
      global: true
    },
    {
      prefix: '',
      path: resolve('./components/content'),
      global: true
    },
    {
      prefix: '',
      path: resolve('./components/icons'),
      global: true
    },
    {
      prefix: '',
      path: resolve('./components/landing'),
      global: true
    }
  ],

  pinceau: {
    configFileName: 'tokens.config'
  },

  content: {
    // https://content.nuxtjs.org/api/configuration
    documentDriven: true,
    highlight: {
      theme: 'one-dark-pro',
      preload: ['json', 'js', 'ts', 'html', 'css', 'vue', 'diff', 'shell', 'markdown', 'yaml', 'bash', 'ini']
    },
    navigation: {
      fields: ['icon', 'titleTemplate']
    }
  },
  vite: {
    vue: {
      customElement: true
    },
    vueJsx: {
      mergeProps: true
    }
  },
  vue: {
    defineModel: true,
    propsDestructure: true
  },
  devtools: {
    // Enable devtools (default: true)
    enabled: true,
    // VS Code Server options
    vscode: {},
    // ...other options
  },
  typescript: {
    shim: false
  },

  colorMode: {
    classSuffix: '',
    dataValue: 'theme'
  }
})
