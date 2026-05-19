import Link from "next/link";
import type { Metadata } from "next";
import { PostList } from "@/components/blog/PostList";
import { getPublishedPosts } from "@/lib/content/repository";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME ?? "Blog",
  description: `Personal blog by ${process.env.NEXT_PUBLIC_AUTHOR_NAME ?? "Ian"}`,
};

const RECENT_POSTS_LIMIT = 6;

export default async function HomePage() {
  const allPosts = await getPublishedPosts();
  const recentPosts = allPosts.slice(0, RECENT_POSTS_LIMIT);

  const authorName = process.env.NEXT_PUBLIC_AUTHOR_NAME ?? "Ian";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Blog";

  return (
    <div className="mx-auto grid max-w-6xl gap-16 px-4 py-12 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-20 lg:py-20">
      <aside className="hidden border-r border-border pr-8 text-sm text-muted-foreground lg:block">
        <div className="sticky top-28 space-y-8">
          <div>
            <p className="mb-2 font-medium uppercase tracking-[0.18em] text-foreground">
              Index
            </p>
            <nav className="space-y-2" aria-label="Page sections">
              <a
                href="#intro"
                className="block hover:text-foreground hover:underline"
              >
                Introduction
              </a>
              <a
                href="#recent-posts"
                className="block hover:text-foreground hover:underline"
              >
                Recent writing
              </a>
            </nav>
          </div>
          <div className="space-y-2 border-t border-border pt-6">
            <p>Software, infrastructure, and notes from the workbench.</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Hero */}
        <section
          id="intro"
          className="mb-20 grid gap-10 border-b border-border pb-14 lg:grid-cols-[minmax(0,1fr)_220px]"
          aria-labelledby="hero-heading"
          data-testid="hero-section"
        >
          <div className="space-y-7">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Personal journal
            </p>
            <h1
              id="hero-heading"
              className="max-w-3xl font-serif text-5xl font-normal leading-[1.05] text-foreground sm:text-6xl lg:text-7xl"
            >
              {siteName}
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Hi, I&apos;m{" "}
              <span className="text-foreground">{authorName}</span>, and I
              write about software development, cloud infrastructure, and the
              small decisions that make systems feel durable.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                data-testid="hero-cta-blog"
              >
                Read the blog
                <span aria-hidden="true">-&gt;</span>
              </Link>

              <Link
                href="/about"
                className="inline-flex items-center px-1 py-2 text-sm text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                data-testid="hero-cta-about"
              >
                About me
              </Link>
            </div>
          </div>

          <dl className="grid content-start gap-5 border-t border-border pt-6 text-sm text-muted-foreground lg:border-l lg:border-t-0 lg:pl-8 lg:pt-1">
            <div>
              <dt className="mb-1 uppercase tracking-[0.16em] text-foreground">
                Source
              </dt>
              <dd>Notion + Markdown</dd>
            </div>
            <div>
              <dt className="mb-1 uppercase tracking-[0.16em] text-foreground">
                Delivery
              </dt>
              <dd>AWS static export</dd>
            </div>
            <div>
              <dt className="mb-1 uppercase tracking-[0.16em] text-foreground">
                Recent notes
              </dt>
              <dd>{recentPosts.length} published entries</dd>
            </div>
          </dl>
        </section>

        {/* Recent Posts */}
        <section
          id="recent-posts"
          aria-labelledby="recent-posts-heading"
          data-testid="recent-posts-section"
        >
          <div className="mb-8 flex items-end justify-between gap-6 border-b border-border pb-4">
            <h2
              id="recent-posts-heading"
              className="font-serif text-3xl font-normal text-foreground"
            >
              Recent writing
            </h2>

            {allPosts.length > RECENT_POSTS_LIMIT && (
              <Link
                href="/blog"
                className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
                data-testid="view-all-posts-link"
              >
                View all -&gt;
              </Link>
            )}
          </div>

          <PostList
            posts={recentPosts}
            emptyMessage="No posts yet. Check back soon!"
          />
        </section>
      </div>
    </div>
  );
}
