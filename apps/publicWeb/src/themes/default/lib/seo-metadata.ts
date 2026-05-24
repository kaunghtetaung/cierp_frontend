import type { Metadata } from "next";

/**
 * Build Next.js `Metadata` from a Page or Post doc. Pulls the
 * author-set `metaTitle` / `metaDescription` / `metaKeywords` when
 * present, falling back to the visible content (`title`, `excerpt`,
 * `description`) so a page that never had its SEO fields touched
 * still surfaces something meaningful in `<head>`.
 *
 * Used by:
 *   - app/(cms)/[slug]/page.tsx     (content page route)
 *   - app/(cms)/post/[type]/[slug]/page.tsx  (post detail route)
 *
 * Note on Open Graph image absolute URL: Next.js wants an absolute
 * URL for og:image. We pass through whatever the doc has (`featuredImage`
 * is typically a CDN/S3 URL already) and rely on Next.js to leave it
 * untouched when it starts with `http(s)://`.
 */

interface MultiLanguageText {
  en?: string;
  mm?: string;
}

interface SeoSource {
  title?: MultiLanguageText;
  excerpt?: MultiLanguageText;
  description?: MultiLanguageText;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  featuredImage?: string;
  publishedAt?: string;
  updatedAt?: string;
}

export function buildContentMetadata(
  doc: SeoSource | null | undefined,
  options: {
    language?: "en" | "mm";
    /** Fallback title shown when neither metaTitle nor title resolves. */
    fallbackTitle?: string;
    /** Content type — drives `og:type`. Defaults to 'article' for
     * post-style content; pass 'website' for top-level pages. */
    ogType?: "article" | "website";
  } = {},
): Metadata {
  const language = options.language ?? "en";
  const fallbackTitle = options.fallbackTitle ?? "";
  const ogType = options.ogType ?? "article";

  if (!doc) {
    return { title: fallbackTitle || undefined };
  }

  const localizedTitle =
    doc.title?.[language] || doc.title?.en || fallbackTitle || undefined;
  const localizedDescription =
    doc.excerpt?.[language] ||
    doc.excerpt?.en ||
    doc.description?.[language] ||
    doc.description?.en ||
    undefined;

  const title = doc.metaTitle || localizedTitle;
  const description = doc.metaDescription || localizedDescription;
  const keywords = doc.metaKeywords?.length ? doc.metaKeywords : undefined;
  const image = doc.featuredImage;

  // Build OG / Twitter blocks only when there's at least one field
  // worth shipping — Next.js renders empty tags otherwise.
  const hasOgSource = !!(title || description || image);
  const openGraph = hasOgSource
    ? {
        title: title ?? undefined,
        description: description ?? undefined,
        type: ogType,
        locale: language === "mm" ? "my_MM" : "en_US",
        ...(image ? { images: [{ url: image }] } : {}),
        ...(doc.publishedAt ? { publishedTime: doc.publishedAt } : {}),
        ...(doc.updatedAt ? { modifiedTime: doc.updatedAt } : {}),
      }
    : undefined;

  const twitter = hasOgSource
    ? {
        card: image ? "summary_large_image" : "summary",
        title: title ?? undefined,
        description: description ?? undefined,
        ...(image ? { images: [image] } : {}),
      }
    : undefined;

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(keywords ? { keywords } : {}),
    ...(openGraph ? { openGraph } : {}),
    ...(twitter ? { twitter: twitter as any } : {}),
  };
}
