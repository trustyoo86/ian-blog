import { cn } from '@/lib/utils'
import type { TocItem } from '@/types'

interface TableOfContentsProps {
  items: TocItem[]
}

export function TableOfContents({ items }: TableOfContentsProps) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Table of contents"
      className="text-sm lg:sticky lg:top-24"
      data-testid="table-of-contents"
    >
      <p className="mb-3 font-semibold text-foreground">On this page</p>
      <ul className="space-y-2 border-l border-border">
        {items.map((item) => (
          <li key={item.id} className={cn(item.depth === 3 ? 'pl-7' : 'pl-4')}>
            <a
              href={`#${item.id}`}
              className="block text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
