import type { MaybeRefOrGetter } from 'vue'
import type { AppConfig } from 'nuxt/schema'
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
 * `contactPoint` and `address` are intentionally not derived from anything —
 * they can only come from real business data, so they must be provided by the
 * site itself if needed.
 */
function buildOrganizationNode(organization: SeoOrganizationConfig, id: string, baseUrl: string) {
  const node: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': id,
    'name': organization.name,
    'url': organization.url || baseUrl,
  }

  if (organization.logo) {
    node.logo = organization.logo.startsWith('http') ? organization.logo : joinURL(baseUrl, organization.logo)
  }

  if (organization.sameAs?.length) {
    node.sameAs = organization.sameAs
  }

  return node
}

/**
 * `Organization` nodes for the site publisher and, when the publisher belongs to
 * a larger company, its parent. Both are linked so the graph has no orphan node,
 * and `publisher` keeps pointing at a single entity.
 */
function buildOrganizationSchemas(schema: SeoSchemaConfig | undefined, baseUrl: string) {
  const organization = schema?.organization
  if (!organization?.name) return []

  const publisher = buildOrganizationNode(organization, `${baseUrl}/#organization`, baseUrl)
  const nodes = [publisher]

  const parent = organization.parentOrganization
  if (parent?.name) {
    const parentId = `${baseUrl}/#parent-organization`
    publisher.parentOrganization = { '@id': parentId }
    nodes.push(buildOrganizationNode(parent, parentId, baseUrl))
  }

  return nodes
}

/**
 * The node that answers "what is this site?" — a product, a company, a person.
 */
function buildIdentitySchema(
  schema: SeoSchemaConfig | undefined,
  context: { baseUrl: string, name: string | undefined, description: string | undefined, organizationId?: string },
) {
  const type = schema?.type
  if (!type || !context.name) return undefined

  // The publisher Organization is already emitted as its own node.
  if (type === 'Organization' && schema?.organization?.name) return undefined

  const node: Record<string, unknown> = {
    '@type': type,
    '@id': `${context.baseUrl}/#identity`,
    'name': context.name,
    'description': context.description,
    'url': context.baseUrl,
  }

  if (schema?.sameAs?.length) {
    node.sameAs = schema.sameAs
  }

  if (type === 'SoftwareApplication') {
    node.applicationCategory = schema?.applicationCategory || 'DeveloperApplication'
    node.operatingSystem = schema?.operatingSystem || 'Web'
  }

  if (typeof schema?.price === 'number' && (type === 'SoftwareApplication' || type === 'Product')) {
    node.offers = {
      '@type': 'Offer',
      'price': schema.price,
      'priceCurrency': schema.priceCurrency || 'USD',
    }
  }

  if (context.organizationId && type !== 'Person') {
    node.publisher = { '@id': context.organizationId }
  }

  return node
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
  const seoSchema = useAppConfig().seo?.schema
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

      // WebSite schema for landing pages, plus the site identity when configured
      if (type.value === 'website') {
        const websiteSchema: Record<string, unknown> = {
          '@type': 'WebSite',
          '@id': `${baseUrl.value}/#website`,
          'name': site.name || title.value,
          'description': description.value,
          'url': baseUrl.value,
        }

        const graph: Record<string, unknown>[] = [websiteSchema]

        // The first node is the publisher; any other is a company it belongs to.
        const organizationSchemas = buildOrganizationSchemas(seoSchema, baseUrl.value)
        const publisherId = organizationSchemas[0]?.['@id'] as string | undefined
        if (organizationSchemas.length) {
          graph.push(...organizationSchemas)
          websiteSchema.publisher = { '@id': publisherId }
        }

        const identitySchema = buildIdentitySchema(seoSchema, {
          baseUrl: baseUrl.value,
          name: site.name || title.value,
          description: description.value,
          organizationId: publisherId,
        })
        if (identitySchema) {
          graph.push(identitySchema)
          websiteSchema.about = { '@id': identitySchema['@id'] }
        }

        scripts.push({
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': graph,
          }),
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
