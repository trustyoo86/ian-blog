import rehypeShiki from '@shikijs/rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { toString as hastToString } from 'hast-util-to-string'
import type { Element, Root as HastRoot } from 'hast'
import type { Root as MdastRoot } from 'mdast'
import type { TocItem } from '@/types'

/**
 * The post title is rendered separately by PostHeader as the page's single
 * <h1>. Demote any body-level H1 to H2 so a post body cannot introduce a
 * second H1 (SEO/a11y) and so it still appears as a top-level TOC entry.
 */
function remarkDemoteHeadings() {
  return (tree: MdastRoot) => {
    visit(tree, 'heading', (node) => {
      if (node.depth === 1) {
        node.depth = 2
      }
    })
  }
}

/**
 * Collect h2/h3 headings (with the id assigned by rehype-slug) into `toc`.
 * Uses hast-util-to-string so headings containing inline code/links/emphasis
 * keep their full text instead of being truncated.
 */
function rehypeCollectToc(toc: TocItem[]) {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'h2' && node.tagName !== 'h3') return
      const id = node.properties?.id
      if (typeof id !== 'string' || id.length === 0) return
      toc.push({
        id,
        text: hastToString(node),
        depth: node.tagName === 'h2' ? 2 : 3,
      })
    })
  }
}

/**
 * Render a Markdown string to HTML at build time (static export).
 *
 * Plugin order is load-bearing — do not reorder:
 * - rehype-raw must run before rehype-slug so headings authored as raw HTML
 *   are parsed into the hast tree before ids are assigned.
 * - @shikijs/rehype must run after rehype-raw so code fences exist in hast.
 * - both remark-rehype and rehype-stringify need allowDangerousHtml so raw
 *   HTML survives instead of being escaped.
 */
export async function renderMarkdown(
  content: string
): Promise<{ html: string; toc: TocItem[] }> {
  const toc: TocItem[] = []

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDemoteHeadings)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeCollectToc, toc)
    .use(rehypeShiki, {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content)

  return { html: String(file), toc }
}
