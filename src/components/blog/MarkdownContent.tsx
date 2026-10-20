import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  /** Pre-rendered HTML from the Markdown renderer. */
  html: string;
  className?: string;
}

export function MarkdownContent({ html, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "prose prose-neutral min-w-0 max-w-none dark:prose-invert",
        className,
      )}
      data-testid="post-content"
      // renderMarkdown leaves raw source HTML unparsed.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
