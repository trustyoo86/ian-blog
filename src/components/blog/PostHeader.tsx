import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import { TagBadge } from '@/components/blog/TagBadge'
import type { BlogPost } from '@/types'

interface PostHeaderProps {
  post: BlogPost
}

export function PostHeader({ post }: PostHeaderProps) {
  return (
    <header className="mb-10 flex flex-col gap-4" data-testid="post-header">
      {post.coverImage && (
        <div className="relative h-64 w-full overflow-hidden rounded-xl">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        {post.category}
      </p>

      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {post.title}
      </h1>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <time dateTime={post.publishedDate} data-testid="post-header-date">
          {formatDate(post.publishedDate)}
        </time>
        {post.readingTime ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{post.readingTime} min read</span>
          </>
        ) : null}
      </div>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} href={`/tags/${encodeURIComponent(tag)}`} />
          ))}
        </div>
      )}
    </header>
  )
}
