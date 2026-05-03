import { execSync } from 'node:child_process'

// ── بصمة الإنتاج (Production Fingerprint) ─────────────────────────────────
const buildTime = new Date().toISOString()
const gitCommit = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() }
  catch { return 'unknown' }
})()
const gitBranch = (() => {
  try { return execSync('git rev-parse --abbrev-ref HEAD').toString().trim() }
  catch { return 'unknown' }
})()
// ──────────────────────────────────────────────────────────────────────────

export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@nuxtjs/i18n', 'nuxt-studio'],
  css: ['~/assets/css/main.css'],
  site: {
    name: 'مجموعة العزب',
  },
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
  mdc: {
    highlight: {
      shikiEngine: 'javascript',
    },
  },
  compatibilityDate: '2025-07-18',

  // ── بصمة الإنتاج — تُحقن في وقت البناء وتُكشف للعميل ──────────────────
  runtimeConfig: {
    public: {
      buildInfo: {
        time: buildTime,
        commit: gitCommit,
        branch: gitBranch,
        version: process.env.npm_package_version || '5.10.0',
      },
    },
  },

  nitro: {
    serverAssets: [
      {
        baseName: 'alazab',
        dir: './alazab',
      },
    ],
  },
  vite: {
    build: {
      sourcemap: false,
    },
  },
  i18n: {
    defaultLocale: 'ar',
    locales: [{
      code: 'ar',
      name: 'العربية',
      dir: 'rtl',
    }],
  },
  llms: {
    domain: 'https://alazab.com',
    title: 'قاعدة معرفة مجموعة العزب',
    description: 'قاعدة المعرفة الرسمية لمجموعة العزب للحلول المعمارية.',
    full: {
      title: 'قاعدة معرفة مجموعة العزب',
      description: 'قاعدة المعرفة الرسمية لمجموعة العزب للحلول المعمارية.',
    },
  },
  mcp: {
    name: 'قاعدة معرفة مجموعة العزب',
    browserRedirect: '/ar',
  },
  studio: {
    route: '/admin',
    repository: {
      provider: 'github',
      owner: 'mohamedazab224',
      repo: 'docus',
      rootDir: 'docs',
    },
  },
})
