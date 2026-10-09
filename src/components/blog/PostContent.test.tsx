import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PostContent } from "@/components/blog/PostContent";

const TABLE_MD = ["| Name | Value |", "| --- | --- |", "| alpha | 1 |"].join("\n");
const CHECKLIST_MD = ["- [x] shipped", "- [ ] pending"].join("\n");
const QUOTE_AND_IMAGE_MD = [
  "> Quoted wisdom",
  "",
  "![Diagram](https://prod-files-secure.s3.amazonaws.com/notion/diagram.png)",
].join("\n");
const CODE_MD = ["```ts", "const answer: number = 42;", "```"].join("\n");
const UNKNOWN_LANG_MD = ["```not-a-real-lang", "plain <b>text</b>", "```"].join("\n");
const RAW_HTML_MD = [
  "Before",
  "",
  '<script>window.__pwned = true;</script>',
  "",
  '<iframe src="https://evil.example"></iframe>',
  "",
  "After",
].join("\n");

async function renderContent(content: string) {
  return render(await PostContent({ content }));
}

afterEach(() => cleanup());

describe("PostContent", () => {
  it("renders GFM tables as <table> (FR3.3)", async () => {
    await renderContent(TABLE_MD);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "alpha" })).toBeInTheDocument();
  });

  it("renders task lists as checkbox inputs (FR3.3)", async () => {
    await renderContent(CHECKLIST_MD);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it("renders blockquotes and lazy images keeping the source URL (FR3.3, FR3.5)", async () => {
    const { container } = await renderContent(QUOTE_AND_IMAGE_MD);

    expect(container.querySelector("blockquote")).toHaveTextContent("Quoted wisdom");
    const image = screen.getByRole("img", { name: "Diagram" });
    expect(image).toHaveAttribute(
      "src",
      "https://prod-files-secure.s3.amazonaws.com/notion/diagram.png",
    );
    expect(image).toHaveAttribute("loading", "lazy");
  });

  it("highlights code blocks with shiki and preserves the source (FR3.4)", async () => {
    const { container } = await renderContent(CODE_MD);

    const block = container.querySelector("pre.shiki");
    expect(block).not.toBeNull();
    expect(block?.closest("[data-language]")).toHaveAttribute("data-language", "ts");
    expect(block).toHaveTextContent("const answer: number = 42;");
    expect(block?.querySelectorAll("span[style]").length).toBeGreaterThan(1);
  });

  it("falls back to plain text for unknown languages without parsing HTML (FR3.4)", async () => {
    const { container } = await renderContent(UNKNOWN_LANG_MD);

    const block = container.querySelector("pre.shiki");
    expect(block?.closest("[data-language]")).toHaveAttribute("data-language", "text");
    expect(block).toHaveTextContent("plain <b>text</b>");
    expect(block?.querySelector("b")).toBeNull();
  });

  it("never turns raw HTML in the body into elements (NFR3)", async () => {
    const { container } = await renderContent(RAW_HTML_MD);

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
  });
});
