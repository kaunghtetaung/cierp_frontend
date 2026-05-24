import React from "react";
import Link from "next/link";
import { Calendar, Clock, Folder, Tag as TagIcon, User } from "lucide-react";
import { PostHero } from "./PostHero";
import { PostSidebar } from "./PostSidebar";
import { PostBody } from "@/themes/default/templates/post/body/PostBody";
import { RelatedPostsBlock } from "@/themes/default/templates/post/RelatedPostsBlock";

interface ArticlePageProps {
  post: any;
  categories?: any[];
  tags?: any[];
  related?: any[];
  currentLanguage?: "en" | "mm";
  crumbs?: Array<{ label: string; href?: string }>;
}

/**
 * um1sf article-style post page (news / announcement / article).
 *
 * Structure mirrors the default theme:
 *   - Themed PostHero (featured image OR primary band) with breadcrumbs
 *   - 8/4 grid: meta strip + body on the left, sidebar on the right
 *
 * Body components are imported from the default theme — they're
 * theme-neutral content renderers (Tiptap, gallery, PDF embed, …)
 * that already pick up styling from CSS variables.
 */
export function ArticlePage({
  post,
  categories,
  tags,
  related,
  currentLanguage = "en",
  crumbs,
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
  // `post.categoryIds` / `post.tagIds` (backend `.populate()` swaps
  // ObjectIds for `{ _id, name, slug }` in-place). Surfaced in the
  // meta strip so readers see "filed under" without having to scan
  // the sidebar (which holds the full site-wide taxonomy instead).
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

  // Viewer-based content types want the full width — sidebar
  // squeezes a PDF embed / slide deck into a too-narrow column.
  // Add new types to this set as more viewer body components land
  // (e.g. `gallery` for a full-bleed lightbox grid).
  const FULL_WIDTH_TYPES = new Set(["pdf", "slides"]);
  const isFullWidth = FULL_WIDTH_TYPES.has(post.contentType as string);

  return (
    <div className="w-full">
      <PostHero
        title={title}
        // Excerpt always renders in the body area instead of the hero.
        excerpt={undefined}
        // Featured image is rendered as a banner inside the body
        // (above the article text) when present — the hero stays a
        // themed primary band regardless. This avoids showing the
        // same image twice (hero bg + body banner) and keeps the
        // band's identity consistent across posts.
        featuredImageUrl={undefined}
        crumbs={crumbs}
        showTitle={post.showTitle !== false}
        showBreadcrumbs={post.showBreadcrumbs !== false}
      />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 lg:py-16">
        <div
          className={
            isFullWidth
              ? ""
              : "grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16"
          }
        >
          <main className={isFullWidth ? "w-full" : "lg:col-span-8 min-w-0"}>
            {/* No separate intro block — the meta strip below carries
                 this post's categories + tags inline next to date /
                 author / reading time. The right-rail sidebar shows
                 the full site taxonomy for browsing. */}

            {(author ||
              publishedAt ||
              readingMins ||
              postCategories.length > 0 ||
              postTags.length > 0) && (
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs pb-4 mb-6 border-b"
                style={{
                  color: "var(--color-muted-foreground)",
                  borderColor: "var(--color-border)",
                }}
              >
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
                    <Folder
                      className="h-3.5 w-3.5"
                      style={{ color: "var(--color-primary)" }}
                    />
                    {postCategories.map((c: any, i: number) => (
                      <React.Fragment key={c._id}>
                        {i > 0 && <span className="opacity-60">,</span>}
                        <Link
                          href={`/category/${c.slug}`}
                          className="hover:underline underline-offset-2"
                          style={{ color: "var(--color-foreground)" }}
                        >
                          {pickChipLabel(c.name, c.slug, currentLanguage)}
                        </Link>
                      </React.Fragment>
                    ))}
                  </span>
                )}
                {postTags.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <TagIcon
                      className="h-3.5 w-3.5"
                      style={{ color: "var(--color-primary)" }}
                    />
                    {postTags.map((t: any, i: number) => (
                      <React.Fragment key={t._id}>
                        {i > 0 && <span className="opacity-60">,</span>}
                        <Link
                          href={`/tags/${t.slug}`}
                          className="hover:underline underline-offset-2"
                          style={{ color: "var(--color-foreground)" }}
                        >
                          {pickChipLabel(t.name, t.slug, currentLanguage)}
                        </Link>
                      </React.Fragment>
                    ))}
                  </span>
                )}
              </div>
            )}

            {/* Featured image banner — rendered ABOVE the article
                 body when set. No default fallback: posts without
                 a featured image skip this entirely so the body
                 starts cleanly. Mobile goes edge-to-edge via
                 negative horizontal margins; tablet+ pulls the
                 image back inside the column and rounds the
                 corners for a card feel. `loading="lazy"` defers
                 fetch until the user scrolls near it. */}
            {featuredImageUrl && (
              <figure
                className="mb-8 -mx-4 sm:mx-0 overflow-hidden sm:rounded-lg border"
                style={{ borderColor: "var(--color-border)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredImageUrl}
                  alt={title || ""}
                  loading="lazy"
                  className="w-full h-auto object-cover"
                />
              </figure>
            )}

            <PostBody post={post} currentLanguage={currentLanguage} />
          </main>

          {!isFullWidth && (
            <div
              // Vertical separator: `lg:border-l` paints a 1px line
              // along the left edge of the sidebar column on lg+
              // viewports, sitting inside the gap between the
              // article body and the sidebar content. `lg:pl-10`
              // pushes the widgets clear of the line so the
              // separator stays a visual rule, not a content edge.
              // On mobile the columns stack so we drop the border.
              className="lg:col-span-4 lg:border-l lg:pl-10"
              style={{ borderColor: "var(--color-border)" }}
            >
              <PostSidebar
                categories={categories}
                tags={tags}
                /* `related` now renders below the grid as a
                   RelatedPostsBlock — pass undefined so the sidebar
                   doesn't show the same posts twice. */
                related={undefined}
                currentLanguage={currentLanguage}
              />
            </div>
          )}
        </div>

        {/* Related posts — full container width, below the grid.
             Renders in BOTH standard and full-width layouts so
             discovery works regardless of whether the body is a
             Tiptap article or a PDF viewer. Hides itself if
             `related` is empty. */}
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
