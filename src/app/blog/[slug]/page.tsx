import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/blog/MarkdownContent";
import { PostHeader } from "@/components/blog/PostHeader";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { renderMarkdown } from "@/lib/content/markdown-render";
import { getAllSlugs, getPostBySlug } from "@/lib/content/repository";
import { cn } from "@/lib/utils";

interface BlogPostPageProps {
  params: { slug: string };
}

function resolveSlug(rawSlug: string): string {
  try {
    return decodeURIComponent(rawSlug);
  } catch {
    return rawSlug;
  }
}

export async function generateStaticParams(): Promise<
  BlogPostPageProps["params"][]
> {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const post = await getPostBySlug(resolveSlug(params.slug));
  if (!post) return {};

  const images = post.coverImage ? [post.coverImage] : undefined;

  return {
    title: post.title,
    description: post.description || undefined,
    openGraph: {
      title: post.title,
      description: post.description || undefined,
      type: "article",
      publishedTime: post.publishedDate,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description || undefined,
      images,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getPostBySlug(resolveSlug(params.slug));
  if (!post) notFound();

  const { html, toc } = await renderMarkdown(post.content ?? "");
  const hasToc = toc.length > 0;

  return (
    <div
      className={cn(
        "mx-auto px-4 py-12 sm:px-6 lg:py-16",
        hasToc ? "max-w-5xl" : "max-w-3xl",
      )}
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

      <PostHeader post={post} />

      <div
        className={cn(
          hasToc && "lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-10",
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
  );
}
