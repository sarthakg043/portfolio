import "server-only";

import type { ReactNode } from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import type { TiptapMark, TiptapNode } from "@/lib/blog/types";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);

export type TableOfContentsItem = {
  id: string;
  title: string;
  level: number;
};

function stringAttr(node: TiptapNode | TiptapMark, name: string): string | null {
  const value = node.attrs?.[name];
  return typeof value === "string" ? value : null;
}

function numberAttr(node: TiptapNode, name: string): number | null {
  const value = node.attrs?.[name];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nodeText(node: TiptapNode): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(nodeText).join("");
}

function headingSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

function safeUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;

  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function extractTableOfContents(document: TiptapNode): TableOfContentsItem[] {
  const seen = new Map<string, number>();
  const headings: TableOfContentsItem[] = [];

  function visit(node: TiptapNode) {
    if (node.type === "heading") {
      const title = nodeText(node).trim();
      if (title) {
        const base = headingSlug(title);
        const count = seen.get(base) ?? 0;
        seen.set(base, count + 1);
        headings.push({
          id: count ? `${base}-${count + 1}` : base,
          title,
          level: Math.min(Math.max(numberAttr(node, "level") ?? 2, 2), 4),
        });
      }
    }

    node.content?.forEach(visit);
  }

  visit(document);
  return headings;
}

function applyMarks(content: ReactNode, marks: TiptapMark[] | undefined, key: string): ReactNode {
  return (marks ?? []).reduce<ReactNode>((result, mark, index) => {
    const markKey = `${key}-mark-${index}`;
    if (mark.type === "bold") return <strong key={markKey}>{result}</strong>;
    if (mark.type === "italic") return <em key={markKey}>{result}</em>;
    if (mark.type === "strike") return <s key={markKey}>{result}</s>;
    if (mark.type === "underline") return <u key={markKey}>{result}</u>;
    if (mark.type === "code") {
      return (
        <code key={markKey} className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-neutral-800">
          {result}
        </code>
      );
    }
    if (mark.type === "link") {
      const href = safeUrl(stringAttr(mark, "href"));
      if (!href) return result;
      const external = href.startsWith("http");
      return (
        <a
          key={markKey}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer noopener" : undefined}
        >
          {result}
        </a>
      );
    }
    return result;
  }, content);
}

function renderChildren(
  node: TiptapNode,
  key: string,
  headings: TableOfContentsItem[],
  headingIndex: { value: number }
): ReactNode[] {
  return (node.content ?? []).map((child, index) =>
    renderNode(child, `${key}-${index}`, headings, headingIndex)
  );
}

function renderNode(
  node: TiptapNode,
  key: string,
  headings: TableOfContentsItem[],
  headingIndex: { value: number }
): ReactNode {
  if (node.type === "text") {
    return <span key={key}>{applyMarks(node.text ?? "", node.marks, key)}</span>;
  }

  const children = renderChildren(node, key, headings, headingIndex);

  if (node.type === "doc") return <>{children}</>;
  if (node.type === "paragraph") return <p key={key}>{children.length ? children : <br />}</p>;
  if (node.type === "heading") {
    const heading = headings[headingIndex.value++];
    const level = heading?.level ?? Math.min(Math.max(numberAttr(node, "level") ?? 2, 2), 4);
    if (level === 3) return <h3 key={key} id={heading?.id}>{children}</h3>;
    if (level === 4) return <h4 key={key} id={heading?.id}>{children}</h4>;
    return <h2 key={key} id={heading?.id}>{children}</h2>;
  }
  if (node.type === "bulletList") return <ul key={key}>{children}</ul>;
  if (node.type === "orderedList") {
    return <ol key={key} start={numberAttr(node, "start") ?? 1}>{children}</ol>;
  }
  if (node.type === "listItem") return <li key={key}>{children}</li>;
  if (node.type === "blockquote") return <blockquote key={key}>{children}</blockquote>;
  if (node.type === "horizontalRule") return <hr key={key} />;
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "codeBlock") {
    const code = nodeText(node);
    const language = stringAttr(node, "language")?.toLowerCase() ?? "plaintext";
    const highlighted = hljs.getLanguage(language)
      ? hljs.highlight(code, { language, ignoreIllegals: true }).value
      : hljs.highlightAuto(code).value;

    return (
      <figure key={key} className="blog-code-block">
        <figcaption>{language}</figcaption>
        <pre>
          <code className={`hljs language-${language}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </figure>
    );
  }
  if (node.type === "image") {
    const src = safeUrl(stringAttr(node, "src"));
    if (!src) return null;
    const alt = stringAttr(node, "alt") ?? "";
    const title = stringAttr(node, "title");
    return (
      <figure key={key}>
        {/* Article image dimensions are author-controlled metadata and may vary. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" />
        {title ? <figcaption>{title}</figcaption> : null}
      </figure>
    );
  }
  if (node.type === "download") {
    const href = safeUrl(stringAttr(node, "url"));
    if (!href) return null;
    return (
      <a key={key} href={href} className="blog-download-block" download>
        <span>{stringAttr(node, "name") ?? "Download file"}</span>
        <small>{stringAttr(node, "description") ?? "Open or save this attachment"}</small>
      </a>
    );
  }
  if (node.type === "table") return <div key={key} className="blog-table-wrap"><table><tbody>{children}</tbody></table></div>;
  if (node.type === "tableRow") return <tr key={key}>{children}</tr>;
  if (node.type === "tableHeader") return <th key={key}>{children}</th>;
  if (node.type === "tableCell") return <td key={key}>{children}</td>;

  return <div key={key}>{children}</div>;
}

export function renderTiptapDocument(document: TiptapNode): {
  content: ReactNode;
  tableOfContents: TableOfContentsItem[];
} {
  const tableOfContents = extractTableOfContents(document);
  const headingIndex = { value: 0 };

  return {
    content: renderNode(document, "doc", tableOfContents, headingIndex),
    tableOfContents,
  };
}

