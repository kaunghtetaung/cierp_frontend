import React from "react";
import { ArticleBody } from "./ArticleBody";
import { GalleryBody } from "./GalleryBody";
import { PdfBody } from "./PdfBody";
import { SlidesBody } from "./SlidesBody";
import { VideoBody } from "./VideoBody";
import { TableBody } from "./TableBody";

interface PostBodyProps {
  post: any;
  currentLanguage?: "en" | "mm";
}

/**
 * Dispatch on `post.contentType` and render the matching body
 * component. Each body component is self-contained (handles its own
 * empty/missing-data case by returning null), so wiring is trivial.
 *
 *   - article → ArticleBody (Tiptap renderer)
 *   - pdf     → PdfBody
 *   - gallery → GalleryBody
 *   - slides  → SlidesBody
 *   - video   → VideoBody
 *   - table   → TableBody
 *
 * Default falls through to ArticleBody so legacy posts without an
 * explicit `contentType` still render their `body` field.
 */
export function PostBody({ post, currentLanguage = "en" }: PostBodyProps) {
  const contentType = (post?.contentType as string) || "article";

  switch (contentType) {
    case "pdf":
      return (
        <PdfBody block={post?.pdfBlock} currentLanguage={currentLanguage} />
      );
    case "gallery":
      return (
        <GalleryBody
          images={post?.galleryImages}
          currentLanguage={currentLanguage}
        />
      );
    case "slides":
      return (
        <SlidesBody
          block={post?.slidesBlock}
          currentLanguage={currentLanguage}
        />
      );
    case "video":
      return (
        <VideoBody
          block={post?.videoBlock}
          currentLanguage={currentLanguage}
        />
      );
    case "table":
      return <TableBody block={post?.tableBlock} />;
    case "article":
    default:
      return (
        <ArticleBody
          body={post?.body}
          contentFormat={post?.contentFormat}
          currentLanguage={currentLanguage}
        />
      );
  }
}

export default PostBody;
