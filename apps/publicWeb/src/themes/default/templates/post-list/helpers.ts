/**
 * Shared helpers for post-list views (List / Card / Table).
 *
 * Centralizes the per-post derivations so the three view variants
 * stay consistent — same author fallback rules, same href shape,
 * same date formatting.
 */

export interface PostListItem {
  _id: string;
  slug: string;
  title?: { en?: string; mm?: string };
  excerpt?: { en?: string; mm?: string };
  featuredImage?: string | { url?: string };
  publishedAt?: string;
  createdAt?: string;
  postTypeSlug?: string;
  createdBy?:
    | string
    | {
        _id?: string;
        firstName?: string;
        lastName?: string;
        fullName?: string;
        email?: string;
      };
  categoryIds?: Array<{ _id: string; slug: string; name?: any }> | string[];
  tagIds?: Array<{ _id: string; slug: string; name?: any }> | string[];
}

/** Fallback display name when the post's `createdBy` doesn't populate
 *  to a real user. Most legacy / WP-imported posts have a synthetic
 *  ObjectId that doesn't match a User document, so populate yields
 *  `null` or an object with no name fields. Showing "CMS Admin"
 *  keeps the meta strip looking deliberate. */
export const AUTHOR_FALLBACK = "CMS Admin";

export function getAuthorName(
  createdBy: PostListItem["createdBy"] | undefined,
): string {
  if (!createdBy || typeof createdBy === "string") return AUTHOR_FALLBACK;
  const fn = createdBy.fullName?.trim();
  if (fn) return fn;
  const first = createdBy.firstName?.trim();
  const last = createdBy.lastName?.trim();
  const combined = [first, last].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  if (createdBy.email) return createdBy.email;
  return AUTHOR_FALLBACK;
}

export function getTitle(
  post: PostListItem,
  language: "en" | "mm",
): string {
  return (
    post.title?.[language] ||
    post.title?.en ||
    `Post ${post.slug ?? post._id.slice(-6)}`
  );
}

export function getExcerpt(
  post: PostListItem,
  language: "en" | "mm",
): string {
  return post.excerpt?.[language] || post.excerpt?.en || "";
}

export function getFeaturedImageUrl(
  post: PostListItem,
  fallback?: string,
): string | undefined {
  if (typeof post.featuredImage === "string" && post.featuredImage)
    return post.featuredImage;
  if (post.featuredImage && typeof post.featuredImage === "object") {
    if (post.featuredImage.url) return post.featuredImage.url;
  }
  // Site-wide default from content settings (or undefined to let the
  // caller render a gradient placeholder).
  return fallback || undefined;
}

export function getPostHref(post: PostListItem, fallbackType?: string): string {
  const seg = post.postTypeSlug || fallbackType || "article";
  return `/post/${seg}/${post.slug}`;
}

export function getDate(post: PostListItem): Date | null {
  const iso = post.publishedAt || post.createdAt;
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(d: Date, language: "en" | "mm"): string {
  return d.toLocaleDateString(language === "mm" ? "my-MM" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Resolves a `{ en, mm }` or plain-string name from a populated
 *  category/tag doc. Falls back to the slug when no name is set. */
export function pickTaxonomyLabel(
  name: any,
  slug: string,
  language: "en" | "mm",
): string {
  if (typeof name === "string") return name;
  return name?.[language] || name?.en || slug;
}

export function getPopulatedTaxonomy(
  list: PostListItem["categoryIds"] | PostListItem["tagIds"] | undefined,
): Array<{ _id: string; slug: string; name?: any }> {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (x): x is { _id: string; slug: string; name?: any } =>
      !!x && typeof x === "object" && "slug" in x,
  );
}
