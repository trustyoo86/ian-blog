import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostContent } from "@/components/blog/PostContent";
import { TagBadge } from "@/components/blog/TagBadge";
import { getAllSlugs, getPostBySlug } from "@/lib/content/repository";
import { formatDate } from "@/lib/utils";

interface PostPageProps {
  params: { slug: string };
}

// Static export: only slugs returned by generateStaticParams exist.
export const dynamicParams = false;

/**
 * Next may hand over a percent-encoded segment for non-ASCII slugs; decode it
 * when it is valid encoding, otherwise use it as-is.
 */
function resolveSlug(rawSlug: string): string {
  try {
    return decodeURIComponent(rawSlug);
  } catch {
    return rawSlug;
  }
}

// Repository errors (Notion API failure, 429, slug collisions) are intentionally
// not caught here: they must fail the build instead of shipping a broken page.
export async function generateStaticParams(): Promise<PostPageProps["params"][]> {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const post = await getPostBySlug(resolveSlug(params.slug));
  if (!post) return {};

  return {
    title: post.title,
    description: post.description || undefined,
  };
}

/** Post detail page rendering the full Markdown/Notion body. */
export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostBySlug(resolveSlug(params.slug));
  if (!post) notFound();

  return (
    <article
      className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-20"
      data-testid="post-detail"
    >
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        data-testid="back-to-home-link"
      >
        <span aria-hidden="true">&lt;-</span>
        Back to home
      </Link>

      <header className="mb-10 space-y-6 border-b border-border pb-10">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <time dateTime={post.publishedDate} data-testid="post-detail-date">
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

        <h1 className="font-serif text-4xl font-normal leading-tight text-foreground sm:text-5xl">
          {post.title}
        </h1>

        {post.description && (
          <p className="text-lg leading-8 text-muted-foreground">
            {post.description}
          </p>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <TagBadge
                key={tag}
                tag={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
              />
            ))}
          </div>
        )}
      </header>

      {post.coverImage && (
        <div className="relative mb-10 aspect-[16/9] w-full overflow-hidden rounded-[3px] border border-border">
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

      <PostContent content={post.content ?? ""} />
    </article>
  );
}
