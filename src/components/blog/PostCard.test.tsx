import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PostCard } from "@/components/blog/PostCard";
import type { BlogPost } from "@/types";

const TWO_COLUMN_CLASS = "sm:grid-cols-[180px_minmax(0,1fr)]";

function buildPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: "post-1",
    title: "Hello Static Export",
    slug: "hello-static-export",
    description: "A short description of the post.",
    category: "Engineering",
    tags: ["nextjs", "aws"],
    publishedDate: "2026-10-01",
    coverImage: null,
    source: "markdown",
    readingTime: 3,
    ...overrides,
  };
}

afterEach(() => cleanup());

describe("PostCard", () => {
  it("uses a single column when there is no cover image (FR1.1)", () => {
    render(<PostCard post={buildPost()} />);

    const card = screen.getByTestId("post-card");
    expect(card.className).not.toContain(TWO_COLUMN_CLASS);
    expect(card.querySelector("img")).toBeNull();
  });

  it("uses two columns and renders the image when a cover exists (FR1.2)", () => {
    render(
      <PostCard
        post={buildPost({ coverImage: "https://example.com/cover.png" })}
      />,
    );

    const card = screen.getByTestId("post-card");
    expect(card.className).toContain(TWO_COLUMN_CLASS);
    const image = screen.getByRole("img", { name: "Hello Static Export" });
    // next/image may route through its loader in tests; the cover URL must survive.
    expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain(
      "https://example.com/cover.png",
    );
  });

  it("does not cap the description width (FR1.3)", () => {
    render(<PostCard post={buildPost()} />);

    const description = screen.getByText("A short description of the post.");
    expect(description.className).not.toContain("max-w-2xl");
  });

  it("links the whole card to the detail page without nesting anchors (FR2.1-FR2.3)", () => {
    render(<PostCard post={buildPost({ slug: "hello world" })} />);

    const cardLink = screen.getByRole("link", { name: "Hello Static Export" });
    expect(cardLink).toHaveAttribute("href", "/blog/hello%20world/");
    expect(cardLink).toHaveAttribute("data-testid", "post-card-title-link");
    expect(cardLink.className).toContain("after:inset-0");
    expect(screen.getByTestId("post-card").className).toContain("relative");

    expect(screen.getByRole("link", { name: "nextjs" })).toHaveAttribute(
      "href",
      "/tags/nextjs/",
    );
    expect(screen.getByRole("link", { name: "aws" })).toHaveAttribute(
      "href",
      "/tags/aws/",
    );

    const anchors = screen.getByTestId("post-card").querySelectorAll("a");
    expect(anchors).toHaveLength(3);
    anchors.forEach((anchor) => {
      expect(anchor.parentElement?.closest("a")).toBeNull();
    });
  });
});
