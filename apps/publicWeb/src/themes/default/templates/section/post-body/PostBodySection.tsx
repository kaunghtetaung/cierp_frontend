"use client";

import React, { useRef } from "react";
import type { PostBodySectionData, SectionProps } from "../types";
import { usePostContent } from "./PostContentContext";
import { tiptapJsonToHtml } from "./tiptap-render";
import { Lightbox } from "./Lightbox";

/**
 * Placeholder section. Reads the surrounding post / page out of
 * `PostContentContext` (provided by the post-detail page wrapper)
 * and renders its body for the current language.
 *
 * Three body shapes are supported:
 *   1. Tiptap ProseMirror JSON  — converted to HTML via the local
 *      `tiptapJsonToHtml` walker (handles StarterKit + image).
 *   2. HTML / plain / markdown  — injected via
 *      `dangerouslySetInnerHTML`.
 *   3. Anything else — coerced to string via `String()`.
 *
 * No provider mounted = render nothing (the section accidentally
 * landed on a plain page). Same for missing body — slot collapses.
 */
export function PostBodySection({
  currentLanguage = "en",
}: SectionProps<PostBodySectionData>) {
  const ctx = usePostContent();
  // articleRef is declared up-front (not in a conditional) so the hook
  // order is stable across renders when ctx is missing.
  const articleRef = useRef<HTMLElement | null>(null);
  if (!ctx) return null;

  const langBody = (ctx.body as any)?.[currentLanguage];
  const fallbackBody =
    langBody ?? (ctx.body as any)?.en ?? (ctx.body as any)?.mm ?? null;
  if (!fallbackBody) return null;

  const fmt = ctx.contentFormat ?? "html";
  const html =
    fmt === "json"
      ? tiptapJsonToHtml(fallbackBody)
      : typeof fallbackBody === "string"
        ? fallbackBody
        : String(fallbackBody);

  if (!html) return null;

  return (
    <>
      <article
        ref={articleRef}
        // `data-rich-html` drives the typography (heading scale,
        // list indent, table borders, etc.) via inline CSS in
        // globals.css since `@tailwindcss/typography` isn't loaded
        // in this app and bare `prose-*` classes are no-ops.
        //
        // Width: was `max-w-prose` (~65ch ≈ 578px) which left huge
        // empty bands on either side of the article in a 1280px page
        // wrapper. Bumped to `max-w-4xl` (~56rem / 896px) — still
        // narrow enough for comfortable line-length on prose but
        // wide enough that tables / lists / structured content don't
        // feel cramped. The parent wrapper already centers the
        // article via `flex justify-center` (and `mx-auto` on
        // standalone uses), so this just sets the cap.
        //
        // `min-h-[82vh]` reserves a comfortable reading slot for the
        // body even when content is short, so the footer doesn't
        // hop up the page on near-empty articles.
        className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 min-h-[82vh]"
        data-section-type="postBody"
        data-rich-html
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {/* Lightbox: listens for clicks on img[data-lightbox] inside
           the article above and opens a fullscreen modal viewer.
           No-op when the body has no lightbox-marked images. */}
      <Lightbox containerRef={articleRef} />
    </>
  );
}

export default PostBodySection;
