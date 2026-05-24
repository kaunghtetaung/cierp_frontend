"use client";

import React, { createContext, useContext } from "react";

/**
 * Shape of the parent post / page that gets injected into a
 * `PostBodySection`. Only what the renderer needs — title is for
 * accessibility / fallback rendering when body is missing.
 */
export interface PostContentValue {
  /** Per-language Tiptap content. Either HTML string or PM JSON. */
  body: { en?: unknown; mm?: unknown };
  /**
   * Hint about the body's encoding. Drives the renderer's branch:
   *   - 'html' / 'plain' / 'markdown' → render as HTML string
   *   - 'json' → ProseMirror Tiptap doc, requires Tiptap renderer
   * Older posts may carry no contentFormat; defaults to 'html'
   * because that's what the WP importer produces.
   */
  contentFormat?: "plain" | "markdown" | "html" | "json";
  /** Title for accessibility when body is empty / missing. */
  title?: { en?: string; mm?: string };
}

const PostContentContext = createContext<PostContentValue | null>(null);

export function PostContentProvider({
  value,
  children,
}: {
  value: PostContentValue | null;
  children: React.ReactNode;
}) {
  return (
    <PostContentContext.Provider value={value}>
      {children}
    </PostContentContext.Provider>
  );
}

/** Returns null when no provider is mounted (the section just no-ops). */
export function usePostContent(): PostContentValue | null {
  return useContext(PostContentContext);
}

export default PostContentContext;
