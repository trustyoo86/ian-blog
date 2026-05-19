import Link from "next/link";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: string;
  active?: boolean;
  href?: string;
  className?: string;
}

export function TagBadge({ tag, active, href, className }: TagBadgeProps) {
  const baseClass = cn(
    "inline-flex items-center rounded-[3px] border px-2 py-1 text-xs transition-colors",
    active
      ? "border-foreground bg-foreground text-background"
      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={baseClass} data-testid={`tag-badge-${tag}`}>
        {tag}
      </Link>
    );
  }

  return (
    <span className={baseClass} data-testid={`tag-badge-${tag}`}>
      {tag}
    </span>
  );
}
