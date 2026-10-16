// Local copy, Content v4 doesn't export the v3 `TocLink` type.
interface TocLink {
  id: string
  depth: number
  text: string
  children?: TocLink[]
}

type Node = string | [string | null, Record<string, unknown>, ...Node[]]

const TOC_TAGS = ['h2', 'h3']

/**
 * The page TOC links. Content v4 returns `body` as bare nodes, without v3's `toc`.
 * Rebuilt like `@nuxtjs/mdc` did: `h2`/`h3`, searched two levels deep, `h3` nested under `h2`.
 */
export function getTocLinks(body: unknown): TocLink[] {
  const toc = (body as { toc?: { links?: TocLink[] } } | undefined)?.toc
  if (toc) return toc.links || []
  if (!Array.isArray(body)) return []

  const headings = flattenNodes(body as Node[], 2)
    .filter(node => typeof node !== 'string' && TOC_TAGS.includes(node[0] || '') && node[1]?.id)
    .map(node => node as Exclude<Node, string>)
    .map(([tag, props, ...children]) => ({ id: String(props.id), depth: Number(tag!.slice(1)), text: nodeText(children) }))

  return nestLinks(headings)
}

function flattenNodes(nodes: Node[], maxDepth: number, depth = 1): Node[] {
  return nodes.flatMap(node => typeof node === 'string' || depth === maxDepth
    ? [node]
    : [node, ...flattenNodes(node.slice(2) as Node[], maxDepth, depth + 1)])
}

function nodeText(nodes: Node[]): string {
  return nodes.map(node => typeof node === 'string' ? node : node[0] ? nodeText(node.slice(2) as Node[]) : '').join('')
}

function nestLinks(links: TocLink[]): TocLink[] {
  const toc: TocLink[] = []
  for (const link of links) {
    const parent = toc.at(-1)
    if (parent && link.depth > parent.depth) {
      parent.children = [...(parent.children || []), link]
    }
    else {
      toc.push(link)
    }
  }
  return toc
}
