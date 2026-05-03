export default defineAppConfig({
  header: {
    title: 'مجموعة العزب',
    logo: {
      light: '/logo/logo-dark.svg',
      dark: '/logo/logo-light.svg',
      alt: 'شعار مجموعة العزب',
      wordmark: {
        light: '/logo/wordmark-dark.svg',
        dark: '/logo/wordmark-light.svg',
      },
      favicon: '/favicon.svg',
    },
  },
  socials: {
    x: 'https://x.com/alazabgroup',
    website: 'https://alazab.com',
  },
  github: {
    rootDir: 'docs',
  },
  assistant: {
    faqQuestions: {
      ar: [
        {
          category: 'من نحن',
          items: [
            'من أنتم؟',
            'ما هي علامات مجموعة العزب؟',
            'ما هو نطاق عمل المجموعة؟',
          ],
        },
        {
          category: 'الخدمات',
          items: [
            'أريد تنفيذ مشروع كامل، أبدأ من أين؟',
            'ما الفرق بين هوية العلامة التجارية والتشطيب الراقي؟',
            'هل تعملون في السكني والتجاري؟',
          ],
        },
        {
          category: 'الصيانة والتواصل',
          items: [
            'ما هو أوبرفيكس؟',
            'كيف أسجل طلب صيانة؟',
            'كيف يمكن التواصل معكم؟',
          ],
        },
      ],
    },
  },
  toc: {
    bottom: {
      links: [
        {
          icon: 'i-lucide-globe',
          label: 'موقع مجموعة العزب',
          to: 'https://alazab.com',
          target: '_blank',
        },
        {
          icon: 'i-lucide-wrench',
          label: 'أوبرفيكس — الصيانة',
          to: 'https://uberfix.alazab.com',
          target: '_blank',
        },
        {
          icon: 'i-lucide-phone',
          label: 'تواصل معنا',
          to: 'https://linktr.ee/Alazab.co',
          target: '_blank',
        },
        {
          icon: 'i-lucide-building',
          label: 'معرض المشروعات',
          to: '/ar/projects',
        },
        {
          icon: 'i-lucide-hard-drive',
          label: 'مستودع الملفات',
          to: '/ar/assets',
        },
      ],
    },
  },
  ui: {
    pageHero: {
      slots: {
        title: 'font-semibold sm:text-6xl',
        container: '!pb-0',
      },
    },
    pageCard: {
      slots: {
        container: 'lg:flex min-w-0',
        wrapper: 'flex-none',
      },
    },
    contentToc: {
      defaultVariants: {
        highlightVariant: 'circuit',
      },
    },
  },
})
