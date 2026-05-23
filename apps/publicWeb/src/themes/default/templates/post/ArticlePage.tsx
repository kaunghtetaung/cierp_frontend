import React from "react";
import Link from "next/link";
import { Calendar, Clock, Folder, Tag as TagIcon, User } from "lucide-react";
import { PostHero } from "./PostHero";
import { PostSidebar } from "./PostSidebar";
import { PostBody } from "./body/PostBody";
import { RelatedPostsBlock } from "./RelatedPostsBlock";
import { DraftBadge } from "@/feature-components/draft-badge/DraftBadge";

interface ArticlePageProps {
  post: any;
  categories?: any[];
  tags?: any[];
  related?: any[];
  currentLanguage?: "en" | "mm";
  /** Crumbs computed by the route — the page just renders them. */
  crumbs?: Array<{ label: string; href?: string }>;
  /**
   * When provided, replaces the `<PostBody />` slot — used by the
   * password-gate flow so the chrome (hero, meta, sidebar) still
   * renders while the body itself is the unlock form.
   */
  bodySlot?: React.ReactNode;
}

/**
 * Default-theme article-style post page. Used for the news,
 * announcement, and article post types — they all render the same
 * chrome: featured-image hero, author/date meta strip, body, sidebar
 * with categories / tags / related posts.
 *
 * The hero gates on `post.showTitle` (per the page-settings flag).
 * The body branches on `post.contentType` via `PostBody`. The sidebar
 * shows only the widgets that have data.
 */
export function ArticlePage({
  post,
  categories,
  tags,
  related,
  currentLanguage = "en",
  crumbs,
  bodySlot,
}: ArticlePageProps) {
  if (!post) return null;

  const title = post.title?.[currentLanguage] || post.title?.en;
  const excerpt = post.excerpt?.[currentLanguage] || post.excerpt?.en;
  const featuredImageUrl =
    typeof post.featuredImage === "string"
      ? post.featuredImage
      : post.featuredImage?.url;

  const author = post.createdBy?.fullName || post.createdBy?.email;
  const publishedAt = post.publishedAt
    ? new Date(post.publishedAt)
    : null;
  const readingMins =
    post.readingTimeMinutes ??
    post.stats?.readingTime?.minutes ??
    null;

  // THIS post's categories + tags — populated docs on
  // `post.categoryIds` / `post.tagIds`. Shown inline in the meta
  // strip so readers see "filed under" without scanning the sidebar
  // (which holds the full site-wide taxonomy).
  const postCategories = Array.isArray(post.categoryIds)
    ? (post.categoryIds as any[]).filter(
        (c) => c && typeof c === "object" && c.slug,
      )
    : [];
  const postTags = Array.isArray(post.tagIds)
    ? (post.tagIds as any[]).filter(
        (t) => t && typeof t === "object" && t.slug,
      )
    : [];

  // Viewer-based content types want the full width — sidebar squeezes
  // a PDF embed / slide deck into a too-narrow column.
  const FULL_WIDTH_TYPES = new Set(["pdf", "slides"]);
  const isFullWidth = FULL_WIDTH_TYPES.has(post.contentType as string);

  return (
    <div className="w-full">
      <PostHero
        title={title}
        excerpt={undefined}
        // Featured image renders as a banner inside the body (above
        // the article text) when present — keeps the hero a clean
        // themed band and avoids showing the same image twice.
        featuredImageUrl={undefined}
        crumbs={crumbs}
        showTitle={post.showTitle !== false}
        showBreadcrumbs={post.showBreadcrumbs !== false}
        titleAdornment={
          post.status === "Draft" ? (
            <DraftBadge language={currentLanguage} />
          ) : null
        }
      />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 lg:py-16">
        <div
          className={
            isFullWidth
              ? ""
              : "grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16"
          }
        >
          {/* Main column — meta strip + body */}
          <main className={isFullWidth ? "w-full" : "lg:col-span-8 min-w-0"}>
            {/* No separate intro block — the meta strip below carries
                 this post's categories + tags inline next to the
                 date / author / reading time. The right-rail sidebar
                 holds the full site taxonomy for browsing. */}

            {(author ||
              publishedAt ||
              readingMins ||
              postCategories.length > 0 ||
              postTags.length > 0) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground border-b pb-4 mb-6">
                {author && (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {author}
                  </span>
                )}
                {publishedAt && (
                  <time
                    dateTime={publishedAt.toISOString()}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {publishedAt.toLocaleDateString(
                      currentLanguage === "mm" ? "my-MM" : "en-US",
                      { year: "numeric", month: "long", day: "numeric" },
                    )}
                  </time>
                )}
                {readingMins != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {readingMins} min read
                  </span>
                )}
                {postCategories.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <Folder className="h-3.5 w-3.5 text-primary" />
                    {postCategories.map((c: any, i: number) => (
                      <React.Fragment key={c._id}>
                        {i > 0 && <span className="opacity-60">,</span>}
                        <Link
                          href={`/category/${c.slug}`}
                          className="text-foreground hover:underline underline-offset-2"
                        >
                          {pickChipLabel(c.name, c.slug, currentLanguage)}
                        </Link>
                      </React.Fragment>
                    ))}
                  </span>
                )}
                {postTags.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <TagIcon className="h-3.5 w-3.5 text-primary" />
                    {postTags.map((t: any, i: number) => (
                      <React.Fragment key={t._id}>
                        {i > 0 && <span className="opacity-60">,</span>}
                        <Link
                          href={`/tags/${t.slug}`}
                          className="text-foreground hover:underline underline-offset-2"
                        >
                          {pickChipLabel(t.name, t.slug, currentLanguage)}
                        </Link>
                      </React.Fragment>
                    ))}
                  </span>
                )}
              </div>
            )}

            {/* Featured image banner — only renders when the post
                 has its own `featuredImage`. No default fallback;
                 posts without an image skip this. Edge-to-edge on
                 mobile, rounded card on sm+. */}
            {featuredImageUrl && (
              <figure className="mb-8 -mx-4 sm:mx-0 overflow-hidden sm:rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredImageUrl}
                  alt={title || ""}
                  loading="lazy"
                  className="w-full h-auto object-cover"
                />
              </figure>
            )}

            {bodySlot ?? (
              <PostBody post={post} currentLanguage={currentLanguage} />
            )}
          </main>

          {/* Sidebar — categories / tags / related (hidden for viewer
               body types so the embedded PDF/slides has room) */}
          {!isFullWidth && (
            <div className="lg:col-span-4 lg:border-l lg:border-border lg:pl-10">
              <PostSidebar
                categories={categories}
                tags={tags}
                /* Related posts now live below the grid via
                   RelatedPostsBlock — don't duplicate in sidebar. */
                related={undefined}
                currentLanguage={currentLanguage}
              />
            </div>
          )}
        </div>

        {/* Related posts — full container width, below the grid.
             Rendered in both standard and full-width layouts so
             discovery works for article AND PDF body types. */}
        <RelatedPostsBlock
          posts={related as any[]}
          currentLanguage={currentLanguage}
        />
      </div>
    </div>
  );
}

function pickChipLabel(
  name: { en?: string; mm?: string } | string | undefined,
  fallback: string,
  language: "en" | "mm",
): string {
  if (typeof name === "string") return name;
  return name?.[language] || name?.en || fallback;
}

export default ArticlePage;
