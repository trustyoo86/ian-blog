import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  const author = process.env.NEXT_PUBLIC_AUTHOR_NAME ?? "Ian";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>
          &copy; {year} {author}. All rights reserved.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground hover:underline"
            data-testid="footer-github-link"
          >
            GitHub
          </Link>
          <Link
            href={`${siteUrl}/feed.xml`}
            className="transition-colors hover:text-foreground hover:underline"
            data-testid="footer-rss-link"
          >
            RSS
          </Link>
        </div>
      </div>
    </footer>
  );
}
