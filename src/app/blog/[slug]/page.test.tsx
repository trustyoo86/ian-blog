import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { BlogPost } from "@/types";

vi.mock("@/lib/content/repository", () => ({
  getAllSlugs: vi.fn(),
  getPostBySlug: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/content/markdown-render", () => ({
  renderMarkdown: vi.fn(async (content: string) => ({
    html: `<p>${content}</p>`,
    toc: [],
  })),
}));

import { getAllSlugs, getPostBySlug } from "@/lib/content/repository";
import { renderMarkdown } from "@/lib/content/markdown-render";
import { notFound } from "next/navigation";
import PostPage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from "./page";

function buildPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: "post-1",
    title: "Detail Page Title",
    slug: "detail-page",
    description: "Detail page description.",
    category: "Engineering",
    tags: ["nextjs"],
    publishedDate: "2026-10-01T00:00:00.000Z",
    coverImage: null,
    source: "notion",
    readingTime: 2,
    content: "## Section\n\nBody paragraph from Notion.",
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(getAllSlugs).mockReset();
  vi.mocked(getPostBySlug).mockReset();
  vi.mocked(renderMarkdown).mockImplementation(async (content) => ({
    html: `<p>${content}</p>`,
    toc: [],
  }));
  vi.mocked(notFound).mockClear();
});

afterEach(() => cleanup());

describe("blog/[slug] page", () => {
  it("pre-renders one route per published slug (FR3.1)", async () => {
    vi.mocked(getAllSlugs).mockResolvedValue([
      "welcome-to-blog",
      "ai-briefing",
    ]);

    await expect(generateStaticParams()).resolves.toEqual([
      { slug: "welcome-to-blog" },
      { slug: "ai-briefing" },
    ]);
    expect(dynamicParams).toBe(false);
  });

  it("calls notFound() for an unknown slug (FR3.6)", async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(null);

    await expect(PostPage({ params: { slug: "missing" } })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalledTimes(1);
    await expect(
      generateMetadata({ params: { slug: "missing" } }),
    ).resolves.toEqual({});
  });

  it("propagates repository errors instead of hiding them (NFR4)", async () => {
    vi.mocked(getAllSlugs).mockRejectedValue(new Error("Notion API 429"));

    await expect(generateStaticParams()).rejects.toThrow("Notion API 429");
  });

  it("renders metadata, title, body and back link for a post (FR3.2, FR3.7)", async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(buildPost());

    const metadata = await generateMetadata({
      params: { slug: "detail-page" },
    });
    expect(metadata).toMatchObject({
      title: "Detail Page Title",
      description: "Detail page description.",
      openGraph: {
        title: "Detail Page Title",
        description: "Detail page description.",
        type: "article",
        publishedTime: "2026-10-01T00:00:00.000Z",
      },
      twitter: {
        card: "summary_large_image",
        title: "Detail Page Title",
        description: "Detail page description.",
      },
    });

    render(await PostPage({ params: { slug: "detail-page" } }));

    expect(getPostBySlug).toHaveBeenLastCalledWith("detail-page");
    expect(
      screen.getByRole("heading", { level: 1, name: "Detail Page Title" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("post-content")).toHaveTextContent(
      "Body paragraph from Notion.",
    );
    expect(screen.getByRole("link", { name: "nextjs" })).toBeInTheDocument();
    expect(screen.getByTestId("back-to-home-link")).toHaveAttribute(
      "href",
      "/",
    );
  });
});
