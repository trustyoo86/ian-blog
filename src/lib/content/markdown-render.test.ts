import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown-render";

describe("renderMarkdown", () => {
  it("does not render raw HTML as active markup", async () => {
    const { html } = await renderMarkdown('<script>alert("xss")</script>');

    expect(html).not.toContain("<script>");
  });
});
