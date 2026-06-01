import { cn } from '@/lib/utils'

interface MarkdownContentProps {
  /** Pre-rendered, sanitized-by-trust HTML from renderMarkdown(). */
  html: string
  className?: string
}

export function MarkdownContent({ html, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        'prose prose-neutral min-w-0 max-w-none dark:prose-invert',
        className
      )}
      data-testid="markdown-content"
      // Content originates from the author's own Notion/markdown sources (trusted).
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
