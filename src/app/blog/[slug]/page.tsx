import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarkdownContent } from '@/components/blog/MarkdownContent'
import { PostHeader } from '@/components/blog/PostHeader'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { renderMarkdown } from '@/lib/content/markdown-render'
import { getAllSlugs, getPostBySlug } from '@/lib/content/repository'
import { cn } from '@/lib/utils'

interface BlogPostPageProps {
  params: { slug: string }
}

// Static export: every published slug must be generated at build time.
export const dynamicParams = false

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const post = await getPostBySlug(decodeURIComponent(params.slug))
  if (!post) {
    return { title: 'Not Found' }
  }

  const images = post.coverImage ? [post.coverImage] : undefined

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedDate,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getPostBySlug(decodeURIComponent(params.slug))
  if (!post) notFound()

  const { html, toc } = await renderMarkdown(post.content ?? '')
  const hasToc = toc.length > 0

  return (
    <div
      className={cn('mx-auto px-4 py-16', hasToc ? 'max-w-5xl' : 'max-w-3xl')}
    >
      <PostHeader post={post} />

      <div
        className={cn(
          hasToc && 'lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-10'
        )}
      >
        <MarkdownContent html={html} />
        {hasToc && (
          <aside className="hidden self-start lg:block">
            <TableOfContents items={toc} />
          </aside>
        )}
      </div>
    </div>
  )
}
