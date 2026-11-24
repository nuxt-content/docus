import { z } from 'zod'

/**
 * Frontmatter of a Docus page, declared on the content source.
 * A declared schema replaces inference, so fields outside it are untyped.
 */
export const docsSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
  }).optional(),
  navigation: z.any().optional(),
  sitemap: z.boolean().optional(),
  modifiedAt: z.string().optional(),
  links: z.array(z.object({
    label: z.string(),
    icon: z.string(),
    to: z.string(),
    target: z.string().optional(),
  })).optional(),
})
