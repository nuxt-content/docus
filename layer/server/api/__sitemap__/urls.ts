import type { ContentListFile } from 'comark-content'
import type { z } from 'zod'
import type { docsSchema } from '../../../utils/schema'
import { content } from '#imports'
import { isNavigationPath } from '../../utils/content'

/**
 * Every content page, for `@nuxtjs/sitemap`. Content is the single source of
 * truth here: the prerendered routes are excluded, so a page opting out with
 * `sitemap: false` in its frontmatter stays out.
 */
export default defineSitemapEventHandler(async () => {
  // `content` is typed as an instance or a hub, whose `list()` signatures don't combine
  const files = await (content as unknown as { list: () => Promise<ContentListFile<z.infer<typeof docsSchema>>[]> }).list()

  return files
    .filter(file => file.meta.kind === 'document' && file.meta.extension === 'md' && !isNavigationPath(file.path) && file.data?.sitemap !== false)
    .map(file => ({
      loc: file.path,
      // Date part only (YYYY-MM-DD)
      lastmod: typeof file.data?.modifiedAt === 'string' ? file.data.modifiedAt.split('T')[0] : undefined,
    }))
})
