import React from "react";
import { sanitizeHtml } from "@repo/utils/common";
import { tiptapJsonToHtml } from "../../section/post-body/tiptap-render";

/**
 * Undo double-encoded HTML entities. WP-imported posts often store
 * `&amp;nbsp;` (or `&amp;amp;`, etc.) where the source had `&nbsp;`
 * — the entity passed through an encoding step twice. The browser
 * then renders the literal text `&nbsp;` instead of a space.
 *
 * Strategy:
 *   1. Decode common named entities and numeric refs that got
 *      double-encoded back to single-encoded form (browser handles
 *      the rest).
 *   2. Also collapse stray literal `&nbsp;` runs that survived the
 *      decoder (some sources keep them as plain text).
 *
 * Conservative — only touches the entities we've seen in the wild
 * to avoid mangling intentional `&amp;` inside e.g. URLs.
 */
function cleanLegacyHtml(html: string): string {
  if (!html) return html;
  let out = html;
  // `&amp;nbsp;` → `&nbsp;` (and similar named entities). Browser
  // then decodes the singly-encoded form normally on render.
  out = out.replace(
    /&amp;(nbsp|amp|quot|apos|lt|gt|hellip|mdash|ndash|laquo|raquo|copy|reg|trade|deg);/gi,
    "&$1;",
  );
  // `&amp;#NNN;` → `&#NNN;` (double-encoded numeric refs).
  out = out.replace(/&amp;#(\d+);/g, "&#$1;");
  // Hex form `&amp;#x..;` → `&#x..;`.
  out = out.replace(/&amp;#x([0-9a-f]+);/gi, "&#x$1;");
  return out;
}

interface ArticleBodyProps {
  /** Per-language body — `body.en`, `body.mm`. Either Tiptap PM JSON or HTML. */
  body?: { en?: unknown; mm?: unknown } | null;
  contentFormat?: "json" | "html" | "plain" | "markdown";
  currentLanguage?: "en" | "mm";
}

/**
 * Article body renderer — picks the language, converts Tiptap JSON to
 * HTML (or passes through HTML / string content), and injects it into
 * a `prose`-styled article. Reuses the same `tiptapJsonToHtml` walker
 * used by `PostBodySection` so all post types render the same way.
 *
 * Returns `null` when the body has no content for either language —
 * caller decides whether to show "no content yet" placeholder.
 */
export function ArticleBody({
  body,
  contentFormat = "json",
  currentLanguage = "en",
}: ArticleBodyProps) {
  if (!body) return null;
  const langBody = (body as any)[currentLanguage];
  const fallback =
    langBody ?? (body as any).en ?? (body as any).mm ?? null;
  if (!fallback) return null;

  const rawHtml =
    contentFormat === "json"
      ? tiptapJsonToHtml(fallback)
      : typeof fallback === "string"
        ? fallback
        : String(fallback);

  // Strip double-encoded entities (`&amp;nbsp;` → `&nbsp;` etc.)
  // common in WP-imported posts. Applied to BOTH the Tiptap-
  // generated HTML and the raw-HTML branch so legacy + new content
  // both render cleanly.
  const html = cleanLegacyHtml(rawHtml);

  if (!html) return null;

  return (
    <article
      // All article-body typography (line-height, text-shadow) is
      // managed by the `[data-post-body="article"]` CSS block in
      // `globals.css` — Tailwind's descendant-variant utilities
      // (`[&_p]:leading-[…]`) couldn't reliably beat prose's
      // per-tag specificity, and arbitrary-value text-shadow
      // utilities silently dropped declarations. A real CSS file
      // with explicit per-tag rules wins both battles cleanly. See
      // the comment block in `globals.css` for the full rationale.
      className="prose prose-neutral dark:prose-invert max-w-none w-full"
      data-post-body="article"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

export default ArticleBody;
