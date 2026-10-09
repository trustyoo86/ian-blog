import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { bundledLanguages, createHighlighter, type Highlighter } from "shiki";
import { cn } from "@/lib/utils";

const LIGHT_THEME = "github-light";
const DARK_THEME = "github-dark";
const FALLBACK_LANG = "text";
const FENCE_LANG_PATTERN = /^\s*(?:```|~~~)\s*([\w#+.-]+)/gm;

// Created once per module (i.e. once per build worker) and reused for every post.
let highlighterPromise: Promise<Highlighter> | null = null;

function getSharedHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [LIGHT_THEME, DARK_THEME],
      langs: [],
    });
  }
  return highlighterPromise;
}

function isBundledLanguage(lang: string): lang is keyof typeof bundledLanguages {
  return Object.prototype.hasOwnProperty.call(bundledLanguages, lang);
}

/** Loads every known fence language used in the markdown so highlighting can run synchronously. */
async function prepareHighlighter(markdown: string): Promise<Highlighter> {
  const highlighter = await getSharedHighlighter();
  const langs = new Set<string>();
  for (const match of markdown.matchAll(FENCE_LANG_PATTERN)) {
    const lang = match[1].toLowerCase();
    if (isBundledLanguage(lang)) langs.add(lang);
  }
  const loaded = new Set(highlighter.getLoadedLanguages());
  const missing = Array.from(langs).filter((lang) => !loaded.has(lang));
  if (missing.length > 0) {
    await highlighter.loadLanguage(
      ...missing.filter(isBundledLanguage).map((lang) => bundledLanguages[lang]),
    );
  }
  return highlighter;
}

interface HastLike {
  type: string;
  value?: string;
  tagName?: string;
  properties?: { className?: unknown };
  children?: HastLike[];
}

function hastToText(node: HastLike): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(hastToText).join("");
}

function languageOf(codeNode: HastLike | undefined): string {
  const className = codeNode?.properties?.className;
  const classes = Array.isArray(className) ? className.map(String) : [];
  const langClass = classes.find((name) => name.startsWith("language-"));
  return langClass ? langClass.slice("language-".length).toLowerCase() : FALLBACK_LANG;
}

function isExternalHref(href: string | undefined): boolean {
  return Boolean(href && /^https?:\/\//i.test(href));
}

function buildComponents(highlighter: Highlighter): Components {
  const loaded = new Set(highlighter.getLoadedLanguages());

  return {
    pre({ node }) {
      const codeNode = (node as HastLike | undefined)?.children?.find(
        (child) => child.type === "element" && child.tagName === "code",
      );
      const requested = languageOf(codeNode);
      const lang = loaded.has(requested) ? requested : FALLBACK_LANG;
      const code = codeNode ? hastToText(codeNode).replace(/\n$/, "") : "";
      // shiki escapes the source code; this HTML contains no user-supplied markup.
      const html = highlighter.codeToHtml(code, {
        lang,
        themes: { light: LIGHT_THEME, dark: DARK_THEME },
      });
      return (
        <div
          className="not-prose my-6 overflow-x-auto rounded-[3px] border border-border text-sm [&_pre]:p-4"
          data-language={lang}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    },
    img({ src, alt }) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- remote Notion URLs, static export
        <img src={src} alt={alt ?? ""} loading="lazy" className="rounded-[3px]" />
      );
    },
    a({ href, children }) {
      if (isExternalHref(href)) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        );
      }
      return <a href={href}>{children}</a>;
    },
  };
}

interface PostContentProps {
  content: string;
  className?: string;
}

/**
 * Renders a post's Markdown body on the server: GFM (tables, task lists,
 * strikethrough, autolinks), shiki-highlighted code blocks with light/dark
 * themes, lazy images. Raw HTML in the source is never rendered as elements
 * (no rehype-raw).
 */
export async function PostContent({ content, className }: PostContentProps) {
  const highlighter = await prepareHighlighter(content);

  return (
    <div
      className={cn(
        "prose max-w-none text-foreground dark:prose-invert prose-headings:font-serif prose-headings:font-normal prose-a:text-foreground prose-a:underline-offset-4 prose-blockquote:border-border prose-blockquote:text-muted-foreground prose-hr:border-border",
        className,
      )}
      data-testid="post-content"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={buildComponents(highlighter)}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
