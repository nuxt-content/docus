import type { MaybeRefOrGetter } from 'vue'
import type { AppConfig } from 'nuxt/schema'
import type { SoftwareApp } from 'nuxt-schema-org/schema'
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

type SeoSchemaConfig = NonNullable<AppConfig['seo']['schema']>

type SeoOrganizationConfig = NonNullable<SeoSchemaConfig['organization']>

/**
 * The site publisher and, when it belongs to a larger company, its parent
 * nested inside it. `contactPoint` and `address` are passed through as
 * configured: they can only come from real business data, so a site has to
 * provide them itself.
 */
function organizationNode(organization: SeoOrganizationConfig | undefined) {
  if (!organization?.name) return undefined

  const { parentOrganization, ...publisher } = organization

  return defineOrganization({
    ...publisher,
    ...(parentOrganization?.name ? { parentOrganization: { '@type': 'Organization', ...parentOrganization } } : {}),
  })
}

/** The node that answers "what is this site?": a product, a company, a person. */
function identityNode(schema: SeoSchemaConfig | undefined, name: string, description: string | undefined) {
  const shared = {
    name,
    description,
    ...(schema?.sameAs?.length ? { sameAs: schema.sameAs } : {}),
  }
  const offers = typeof schema?.price === 'number'
    ? { offers: { price: schema.price, priceCurrency: schema.priceCurrency || 'USD' } }
    : {}

  switch (schema?.type) {
    case 'SoftwareApplication':
      return defineSoftwareApp({
        ...shared,
        applicationCategory: (schema.applicationCategory || 'DeveloperApplication') as SoftwareApp['applicationCategory'],
        operatingSystem: schema.operatingSystem || 'Web',
        ...offers,
      })
    case 'Product':
      return defineProduct({ ...shared, ...offers })
    case 'Person':
      return definePerson(shared)
    case 'Organization':
      // The publisher Organization is already emitted as its own node
      return schema.organization?.name ? undefined : defineOrganization(shared)
    default:
      return undefined
  }
}

/**
 * Composable for comprehensive SEO setup including:
 * - Meta tags (title, description, og:*, twitter:*)
 * - Canonical and markdown alternate links, through `nuxt-agent-discovery`
 * - Hreflang tags for i18n
 * - JSON-LD structured data, through `nuxt-schema-org`
 */
export function useSeo(options: UseSeoOptions) {
  const route = useRoute()
  const site = useSiteConfig()
  const seoSchema = useAppConfig().seo?.schema
  const { locale, locales, isEnabled: isI18nEnabled, switchLocalePath } = useDocusI18n()

  const title = computed(() => toValue(options.title))
  const description = computed(() => toValue(options.description))
  const type = computed(() => toValue(options.type) || 'article')
  const ogImage = computed(() => toValue(options.ogImage))
  const publishedAt = computed(() => toValue(options.publishedAt))
  const modifiedAt = computed(() => toValue(options.modifiedAt))
  const breadcrumbs = computed(() => toValue(options.breadcrumbs))

  // Base URL for building other URLs
  const baseUrl = computed(() => site.url ? withoutTrailingSlash(site.url) : '')
  const canonicalUrl = computed(() => baseUrl.value ? joinURL(baseUrl.value, route.path) : undefined)

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

  // Canonical link, plus the markdown twin as an alternate representation. A
  // page's twin is its own URL plus `.md`, except at the site root, where the
  // document only has a raw URL.
  const rawPrefix = useRuntimeConfig().public.agentDiscovery?.rawPrefix || '/raw'
  useCanonical(() => route.path === '/' ? `${rawPrefix}/index.md` : `${route.path}.md`)

  // Hreflang tags for i18n
  useHead({
    link: computed(() => {
      const links: Array<{ rel: 'alternate', hreflang: string, href: string }> = []

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
  if (type.value === 'article') {
    useSchemaOrg([
      defineArticle({
        '@type': 'TechArticle',
        'headline': title,
        'description': description,
        'datePublished': publishedAt,
        'dateModified': modifiedAt,
      }),
      defineBreadcrumb(computed(() => ({
        itemListElement: (breadcrumbs.value || []).map(item => ({
          name: item.title,
          item: item.path,
        })),
      }))),
    ])
  }
  else {
    const name = site.name || title.value
    useSchemaOrg([
      defineWebSite({
        name,
        description,
      }),
      ...[organizationNode(seoSchema?.organization), name ? identityNode(seoSchema, name, description.value) : undefined].filter(node => node !== undefined),
    ])
  }
}
