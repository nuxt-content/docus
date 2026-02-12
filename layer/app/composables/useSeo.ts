import type { MaybeRefOrGetter } from 'vue'
import type { BreadcrumbItem } from '../utils/navigation'
import { joinURL, withoutTrailingSlash } from 'ufo'

export interface UseSeoOptions {
  /**
   * Page title
   */
  title: MaybeRefOrGetter<string | undefined>
  /**
   * Page description
   */
  description: MaybeRefOrGetter<string | undefined>
  /**
   * Page type for og:type (default: 'article' for docs, 'website' for landing)
   */
  type?: MaybeRefOrGetter<'website' | 'article'>
  /**
   * Custom OG image URL (absolute)
   */
  ogImage?: MaybeRefOrGetter<string | undefined>
  /**
   * Published date for article schema
   */
  publishedAt?: MaybeRefOrGetter<string | undefined>
  /**
   * Modified date for article schema
   */
  modifiedAt?: MaybeRefOrGetter<string | undefined>
  /**
   * Breadcrumb items for BreadcrumbList schema
   */
  breadcrumbs?: MaybeRefOrGetter<BreadcrumbItem[] | undefined>
}

/**
 * Composable for comprehensive SEO setup including:
 * - Meta tags (title, description, og:*, twitter:*)
 * - Canonical URLs
 * - Hreflang tags for i18n
 * - JSON-LD structured data
 */
export function useSeo(options: UseSeoOptions) {
  const route = useRoute()
  const site = useSiteConfig()
  const { locale, locales, isEnabled: isI18nEnabled, switchLocalePath } = useDocusI18n()

  const title = computed(() => toValue(options.title))
  const description = computed(() => toValue(options.description))
  const type = computed(() => toValue(options.type) || 'article')
  const ogImage = computed(() => toValue(options.ogImage))
  const publishedAt = computed(() => toValue(options.publishedAt))
  const modifiedAt = computed(() => toValue(options.modifiedAt))
  const breadcrumbs = computed(() => toValue(options.breadcrumbs))

  // Build canonical URL
  const canonicalUrl = computed(() => {
    if (!site.url) return undefined
    return joinURL(site.url, route.path)
  })

  // Base URL for building other URLs
  const baseUrl = computed(() => site.url ? withoutTrailingSlash(site.url) : '')

  // Set meta tags
  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: type,
    ogUrl: canonicalUrl,
    ogLocale: computed(() => isI18nEnabled.value ? locale.value : undefined),
  })

  // Set canonical link
  useHead({
    link: computed(() => {
      const links: Array<{ rel: string, href?: string, hreflang?: string }> = []

      // Canonical URL
      if (canonicalUrl.value) {
        links.push({
          rel: 'canonical',
          href: canonicalUrl.value,
        })
      }

      // Hreflang tags for i18n
      if (isI18nEnabled.value && baseUrl.value) {
        for (const loc of locales) {
          const localePath = switchLocalePath(loc.code)
          if (localePath) {
            links.push({
              rel: 'alternate',
              hreflang: loc.code,
              href: joinURL(baseUrl.value, localePath),
            })
          }
        }

        // x-default hreflang (points to default locale)
        const defaultLocalePath = switchLocalePath(locales[0]?.code || 'en')
        if (defaultLocalePath) {
          links.push({
            rel: 'alternate',
            hreflang: 'x-default',
            href: joinURL(baseUrl.value, defaultLocalePath),
          })
        }
      }

      return links
    }),
  })

  // Custom OG image handling
  if (ogImage.value) {
    useSeoMeta({
      ogImage: ogImage.value,
      twitterImage: ogImage.value,
    })
  }

  // JSON-LD structured data
  useHead({
    script: computed(() => {
      const scripts: Array<{ type: string, innerHTML: string }> = []

      if (!baseUrl.value || !title.value) return scripts

      const pageUrl = joinURL(baseUrl.value, route.path)

      // Article schema for documentation pages
      if (type.value === 'article') {
        const articleSchema: Record<string, unknown> = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          'headline': title.value,
          'description': description.value,
          'url': pageUrl,
          'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': pageUrl,
          },
        }

        if (publishedAt.value) {
          articleSchema.datePublished = publishedAt.value
        }

        if (modifiedAt.value) {
          articleSchema.dateModified = modifiedAt.value
        }

        if (site.name) {
          articleSchema.publisher = {
            '@type': 'Organization',
            'name': site.name,
          }
        }

        scripts.push({
          type: 'application/ld+json',
          innerHTML: JSON.stringify(articleSchema),
        })
      }

      // WebSite schema for landing pages
      if (type.value === 'website') {
        const websiteSchema: Record<string, unknown> = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          'name': site.name || title.value,
          'description': description.value,
          'url': baseUrl.value,
        }

        scripts.push({
          type: 'application/ld+json',
          innerHTML: JSON.stringify(websiteSchema),
        })
      }

      // BreadcrumbList schema for navigation
      if (breadcrumbs.value && breadcrumbs.value.length > 0) {
        const breadcrumbSchema = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': breadcrumbs.value.map((item, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'name': item.title,
            'item': joinURL(baseUrl.value, item.path),
          })),
        }

        scripts.push({
          type: 'application/ld+json',
          innerHTML: JSON.stringify(breadcrumbSchema),
        })
      }

      return scripts
    }),
  })
}
