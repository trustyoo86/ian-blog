import { PostCard } from "@/components/blog/PostCard";
import type { BlogPost } from "@/types";

interface PostListProps {
  posts: BlogPost[];
  emptyMessage?: string;
}

export function PostList({
  posts,
  emptyMessage = "No posts found.",
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <div
        className="flex min-h-[200px] items-center justify-center border border-dashed border-border"
        data-testid="post-list-empty"
      >
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid" data-testid="post-list">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
