import Link from "next/link";
import Image from "next/image";
import { cn, formatDate } from "@/lib/utils";
import { TagBadge } from "@/components/blog/TagBadge";
import type { BlogPost } from "@/types";

interface PostCardProps {
  post: BlogPost;
}

/**
 * Home/list card for a post. The title link is a "stretched link": its
 * ::after pseudo-element covers the whole card so any click opens the post,
 * while tag links sit above it (z-10) and keep their own targets. No <a> is
 * nested inside another <a>.
 */
export function PostCard({ post }: PostCardProps) {
  return (
    <article
      className={cn(
        "group relative grid gap-5 border-b border-border py-6 transition-colors first:pt-0",
        post.coverImage && "sm:grid-cols-[180px_minmax(0,1fr)]",
      )}
      data-testid="post-card"
    >
      {post.coverImage && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[3px] border border-border sm:aspect-auto sm:h-32">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover grayscale transition duration-300 group-hover:grayscale-0"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <time dateTime={post.publishedDate} data-testid="post-card-date">
            {formatDate(post.publishedDate)}
          </time>
          <span aria-hidden="true">/</span>
          <span>{post.category}</span>
          {post.readingTime && (
            <>
              <span aria-hidden="true">/</span>
              <span>{post.readingTime} min</span>
            </>
          )}
        </div>

        <div className="grid gap-2">
          <Link
            href={`/blog/${encodeURIComponent(post.slug)}/`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-foreground"
            data-testid="post-card-title-link"
          >
            <h2 className="font-serif text-2xl font-normal leading-snug text-foreground transition-colors group-hover:underline line-clamp-2">
              {post.title}
            </h2>
          </Link>

          {post.description && (
            <p className="text-sm leading-6 text-muted-foreground line-clamp-3">
              {post.description}
            </p>
          )}
        </div>

        {post.tags.length > 0 && (
          <div className="relative z-10 flex flex-wrap gap-2 pt-1">
            {post.tags.map((tag) => (
              <TagBadge
                key={tag}
                tag={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
