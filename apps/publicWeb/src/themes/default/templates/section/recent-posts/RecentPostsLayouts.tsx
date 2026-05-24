// Layout primitives for the Recent Posts section. Pure presentational —
// no fetching, no hooks. Imported by both the Server Component (static
// mode) and the Client Component (paginated mode).

import React from "react";
import Link from "next/link";
import { Clock, Folder, Newspaper } from "lucide-react";
import { IconComponent } from "@repo/ui";
import { RecentPostsSectionData } from "../types";
import { getMessages } from "../../../lib/messages";

export interface PostListItem {
  _id: string;
  slug: string;
  title?: { en?: string; mm?: string };
  excerpt?: { en?: string; mm?: string };
  featuredImage?: { url?: string; alt?: { en?: string; mm?: string } };
  publishedAt?: string;
  categories?: Array<{ _id: string; title?: { en?: string; mm?: string } }>;
  authorName?: string;
  postTypeSlug?: string;
}

export const COLS_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-6",
};

interface HeaderProps {
  section: RecentPostsSectionData;
  language: "en" | "mm";
}

export function RecentPostsHeader({ section, language }: HeaderProps) {
  const headline =
    section.headline?.[language] || section.headline?.en;
  const subheadline =
    section.subheadline?.[language] || section.subheadline?.en;
  const viewAllLabel =
    section.viewAllLabel?.[language] || section.viewAllLabel?.en;

  if (!headline && !subheadline && !(viewAllLabel && section.viewAllUrl)) {
    return null;
  }

  return (
    <header className="flex items-end justify-between gap-4 mb-8 pb-3 border-b border-border">
      <div className="min-w-0">
        {headline && (
          <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2.5">
            {section.headlineIcon && (
              <IconComponent
                name={section.headlineIcon}
                size={28}
                className="text-primary shrink-0"
              />
            )}
            <span>{headline}</span>
          </h2>
        )}
        {subheadline && (
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {subheadline}
          </p>
        )}
      </div>
      {viewAllLabel && section.viewAllUrl && (
        <Link
          href={section.viewAllUrl}
          className="text-sm text-primary hover:underline shrink-0"
        >
          {viewAllLabel} →
        </Link>
      )}
    </header>
  );
}

interface SubProps {
  posts: PostListItem[];
  section: RecentPostsSectionData;
  language: "en" | "mm";
  /**
   * Site-wide fallback image, used when a post has no
   * `featuredImage` of its own. Sourced from
   * `Settings.defaultFeatureImage` and threaded down by
   * `RecentPostsSection`. Empty string / undefined → no fallback.
   */
  defaultFeatureImage?: string;
}

export function CardGrid({
  posts,
  section,
  language,
  columnsClass,
  defaultFeatureImage,
}: SubProps & { columnsClass: string }) {
  return (
    <div className={`grid gap-6 ${columnsClass}`}>
      {posts.map((post) => {
        const heroUrl =
          post.featuredImage?.url || defaultFeatureImage || "";
        const heroAlt =
          post.featuredImage?.alt?.[language] ||
          post.featuredImage?.alt?.en ||
          "";
        const showHero = section.showImage !== false && !!heroUrl;
        return (
        <article
          key={post._id}
          className="group rounded-md border border-border bg-card overflow-hidden flex flex-col hover:shadow-md transition-shadow"
        >
          {showHero && (
            <Link
              href={postHref(post)}
              className="block aspect-video overflow-hidden bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroUrl}
                alt={heroAlt}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
          )}
          <div className="p-4 flex flex-col gap-2 flex-1">
            {section.showCategory !== false && post.categories?.[0] && (
              <span className="text-[10px] uppercase tracking-wider text-primary font-medium">
                {post.categories[0].title?.[language] ||
                  post.categories[0].title?.en}
              </span>
            )}
            <h3 className="text-base md:text-lg font-semibold leading-snug text-foreground line-clamp-2">
              <Link
                href={postHref(post)}
                className="hover:text-primary transition-colors"
              >
                {post.title?.[language] || post.title?.en}
              </Link>
            </h3>
            {section.showExcerpt !== false &&
              (post.excerpt?.[language] || post.excerpt?.en) && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {post.excerpt?.[language] || post.excerpt?.en}
                </p>
              )}
            <PostMeta post={post} section={section} className="mt-auto pt-2" />
          </div>
        </article>
        );
      })}
    </div>
  );
}

export function RowList({
  posts,
  section,
  language,
  defaultFeatureImage,
}: SubProps) {
  // Author / date / image visibility honour the section's
  // author-configured flags. Defaults follow the same convention
  // as the rest of the layout: `showImage`, `showCategory`,
  // `showExcerpt`, `showDate` default to true; `showAuthor`
  // defaults to false (most sections don't want a byline).
  return (
    <ul className="space-y-5 md:space-y-6">
      {posts.map((post) => {
        const heroUrl =
          post.featuredImage?.url || defaultFeatureImage || "";
        const heroAlt =
          post.featuredImage?.alt?.[language] ||
          post.featuredImage?.alt?.en ||
          "";
        const showHero = section.showImage !== false && !!heroUrl;
        const date =
          section.showDate !== false && post.publishedAt
            ? new Date(post.publishedAt)
            : null;
        const primaryCat =
          section.showCategory !== false ? post.categories?.[0] : null;
        const catLabel = primaryCat
          ? primaryCat.title?.[language] || primaryCat.title?.en
          : null;
        const title = post.title?.[language] || post.title?.en || "";
        const excerpt =
          section.showExcerpt !== false
            ? post.excerpt?.[language] || post.excerpt?.en
            : null;
        const authorName = section.showAuthor ? post.authorName : null;
        const initials = authorName ? authorInitials(authorName) : null;

        return (
          <li key={post._id}>
            <Link
              href={postHref(post)}
              // `border-[#eef0f3]` — soft neutral gray, lighter than
              // Tailwind's default `border-border` token. The theme
              // border variable was reading too heavy here against
              // the white card background; this matches the soft
              // editorial feel of magazine sites.
              className="group block overflow-hidden rounded-xl border border-[#eef0f3] bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              <article
                className={
                  showHero
                    ? "grid grid-cols-1 sm:grid-cols-[220px_1fr] md:grid-cols-[280px_1fr]"
                    : ""
                }
              >
                {showHero && (
                  <div className="relative aspect-[16/10] sm:aspect-auto sm:h-full overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroUrl}
                      alt={heroAlt}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {date && (
                      <time
                        dateTime={date.toISOString()}
                        className="absolute top-3 left-3 inline-flex flex-col items-center px-2 py-1 rounded-md backdrop-blur-sm shadow-sm bg-background/90"
                        style={{ minWidth: "44px" }}
                        aria-label={formatDate(post.publishedAt!)}
                      >
                        <span className="text-[10px] uppercase tracking-wider font-bold leading-none text-primary">
                          {date.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-lg font-bold leading-tight">
                          {date.getDate()}
                        </span>
                      </time>
                    )}
                  </div>
                )}

                <div className="p-5 md:p-6 flex flex-col gap-3">
                  {catLabel && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-primary">
                      <Folder className="h-3 w-3" />
                      {catLabel}
                    </span>
                  )}

                  <h3 className="font-bold text-lg md:text-xl leading-snug line-clamp-2 transition-colors group-hover:text-primary">
                    {title}
                  </h3>

                  {excerpt && (
                    <p className="text-sm leading-relaxed line-clamp-2 text-muted-foreground">
                      {excerpt}
                    </p>
                  )}

                  {(authorName || date) && (
                    <div className="mt-auto pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f3]">
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        {authorName && (
                          <>
                            <span
                              className="inline-flex items-center justify-center h-7 w-7 rounded-full text-[10px] font-bold bg-primary text-primary-foreground"
                              aria-hidden
                            >
                              {initials}
                            </span>
                            <span className="text-foreground">{authorName}</span>
                          </>
                        )}
                        {!authorName && date && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(post.publishedAt!)}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Read article
                        <ArrowRightLong />
                      </span>
                    </div>
                  )}
                </div>
              </article>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ArrowRightLong() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 12"
      className="h-3 w-5 transition-transform duration-200 group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="2" y1="6" x2="22" y2="6" />
      <polyline points="17 1 22 6 17 11" />
    </svg>
  );
}

export function CompactList({ posts, section, language }: SubProps) {
  return (
    <ul className="divide-y divide-border">
      {posts.map((post) => (
        <li
          key={post._id}
          className="py-3 flex items-center justify-between gap-4"
        >
          <div className="min-w-0 flex items-center gap-3">
            <Newspaper className="h-4 w-4 text-muted-foreground shrink-0" />
            <Link
              href={postHref(post)}
              className="text-sm md:text-base font-medium hover:text-primary transition-colors truncate"
            >
              {post.title?.[language] || post.title?.en}
            </Link>
          </div>
          {section.showDate !== false && post.publishedAt && (
            <time
              dateTime={post.publishedAt}
              className="text-xs text-muted-foreground shrink-0"
            >
              {formatDate(post.publishedAt)}
            </time>
          )}
        </li>
      ))}
    </ul>
  );
}

function PostMeta({
  post,
  section,
  className = "",
}: {
  post: PostListItem;
  section: RecentPostsSectionData;
  className?: string;
}) {
  const showDate = section.showDate !== false && post.publishedAt;
  const showAuthor = section.showAuthor && post.authorName;
  if (!showDate && !showAuthor) return null;
  return (
    <div
      className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
    >
      {showAuthor && <span>{post.authorName}</span>}
      {showAuthor && showDate && <span>·</span>}
      {showDate && (
        <time dateTime={post.publishedAt}>
          {formatDate(post.publishedAt!)}
        </time>
      )}
    </div>
  );
}

function postHref(post: PostListItem): string {
  // Match the existing publicWeb post route structure. The legacy
  // pattern `/post/<postType>/<slug>` keeps news/article URLs stable.
  const seg = post.postTypeSlug || "article";
  return `/post/${seg}/${post.slug}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

interface RenderPostsProps {
  posts: PostListItem[];
  section: RecentPostsSectionData;
  language: "en" | "mm";
  defaultFeatureImage?: string;
}

/** Pick the right layout based on `section.layout`. */
export function RenderPosts({
  posts,
  section,
  language,
  defaultFeatureImage,
}: RenderPostsProps) {
  const layout = section.layout ?? "grid";
  const columns = section.columns ?? 3;
  if (posts.length === 0) {
    const t = getMessages(language);
    return (
      <p className="text-sm text-muted-foreground italic py-8 text-center">
        {t.recentPosts.noPosts}
      </p>
    );
  }
  if (layout === "compact") {
    return (
      <CompactList
        posts={posts}
        section={section}
        language={language}
        defaultFeatureImage={defaultFeatureImage}
      />
    );
  }
  if (layout === "list") {
    return (
      <RowList
        posts={posts}
        section={section}
        language={language}
        defaultFeatureImage={defaultFeatureImage}
      />
    );
  }
  if (layout === "overlay") {
    return (
      <OverlayList
        posts={posts}
        section={section}
        language={language}
        defaultFeatureImage={defaultFeatureImage}
        columnsClass={COLS_CLASS[columns] ?? COLS_CLASS[3]}
      />
    );
  }
  if (layout === "mosaic") {
    return (
      <MosaicGrid
        posts={posts}
        section={section}
        language={language}
        defaultFeatureImage={defaultFeatureImage}
      />
    );
  }
  if (layout === "duo") {
    return (
      <DuoGrid
        posts={posts}
        section={section}
        language={language}
        defaultFeatureImage={defaultFeatureImage}
      />
    );
  }
  return (
    <CardGrid
      posts={posts}
      section={section}
      language={language}
      defaultFeatureImage={defaultFeatureImage}
      columnsClass={COLS_CLASS[columns] ?? COLS_CLASS[3]}
    />
  );
}

/**
 * Overlay layout — magazine-cover cards.
 *
 *  - Featured image fills the card (16:9 aspect)
 *  - Dark bottom-to-top gradient keeps title legible against ANY
 *    image (light or dark)
 *  - Category badge top-left, date top-right (always visible)
 *  - Title sits at the bottom, white on the gradient
 *  - On hover (md+): image zooms, gradient darkens, excerpt +
 *    author + "Read article" slide up from below
 *  - On mobile (no hover): excerpt is always visible since touch
 *    devices have no hover state — keeps the design accessible
 *    without burying secondary info
 *
 * Posts without a featured image fall back to the site-wide
 * `defaultFeatureImage`; if that's also missing, a gradient
 * placeholder takes the image slot so the layout stays consistent.
 */
export function OverlayList({
  posts,
  section,
  language,
  defaultFeatureImage,
  columnsClass,
}: SubProps & { columnsClass: string }) {
  return (
    <div className={`grid gap-4 md:gap-6 ${columnsClass}`}>
      {posts.map((post) => {
        const heroUrl = post.featuredImage?.url || defaultFeatureImage || "";
        const heroAlt =
          post.featuredImage?.alt?.[language] ||
          post.featuredImage?.alt?.en ||
          "";
        const title = post.title?.[language] || post.title?.en || "";
        const excerpt =
          section.showExcerpt !== false
            ? post.excerpt?.[language] || post.excerpt?.en
            : null;
        const catLabel =
          section.showCategory !== false && post.categories?.[0]
            ? post.categories[0].title?.[language] ||
              post.categories[0].title?.en
            : null;
        const date =
          section.showDate !== false && post.publishedAt
            ? new Date(post.publishedAt)
            : null;
        const author = section.showAuthor ? post.authorName : null;

        return (
          <Link
            key={post._id}
            href={postHref(post)}
            className="group relative block aspect-[4/3] md:aspect-[16/10] overflow-hidden rounded-xl bg-muted"
          >
            {heroUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={heroUrl}
                alt={heroAlt}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)",
                }}
              />
            )}

            {/* Gradient veil — darker on hover to lift contrast as
                 the slide-up content appears. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-300 group-hover:from-black/95 group-hover:via-black/60"
            />

            {/* Top row — category + date overlays */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
              {catLabel ? (
                <span className="inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded shadow-sm bg-primary text-primary-foreground">
                  {catLabel}
                </span>
              ) : (
                <span />
              )}
              {date && (
                <time
                  dateTime={date.toISOString()}
                  className="text-[11px] font-medium px-2 py-1 rounded backdrop-blur-sm bg-white/85 text-foreground shadow-sm"
                >
                  {formatDate(post.publishedAt!)}
                </time>
              )}
            </div>

            {/* Bottom content — title always visible; excerpt +
                 meta slide-in on hover (md+). Mobile shows excerpt
                 inline since hover doesn't apply on touch. */}
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-white">
              <h3 className="font-bold text-base md:text-lg lg:text-xl leading-snug line-clamp-2 drop-shadow-sm">
                {title}
              </h3>

              {/* Mobile: excerpt always visible (no hover) */}
              {excerpt && (
                <p className="text-sm leading-relaxed mt-2 line-clamp-2 opacity-90 md:hidden">
                  {excerpt}
                </p>
              )}

              {/* Desktop: details slide up on hover */}
              <div className="hidden md:block overflow-hidden">
                <div className="mt-2 max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 transition-all duration-300 ease-out">
                  {excerpt && (
                    <p className="text-sm leading-relaxed line-clamp-2 opacity-90">
                      {excerpt}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    {author && <span className="opacity-90">{author}</span>}
                    <span className="ml-auto inline-flex items-center gap-1 font-semibold">
                      Read article
                      <ArrowRightLong />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Mosaic layout — Stanford editorial pattern.
 *
 * 4 posts laid out in 2 rows of an asymmetric 12-col grid:
 *
 *   Row 1: ┌──────────────────────┐  ┌──────────┐
 *          │  POST 1 (col-span-8) │  │ POST 2   │  ← stacked
 *          │  big feature image   │  ├──────────┤    in the
 *          │                      │  │ POST 3   │    4-col side
 *          └──────────────────────┘  └──────────┘
 *
 *   Row 2: ┌──────────────────────────────────────┐
 *          │  POST 4 — full-width feature         │  banner card
 *          └──────────────────────────────────────┘
 *
 * Renders whatever's available — falls through cleanly with 1/2/3
 * posts (no broken empty slots) by hiding the un-filled cells. If
 * fewer than 4 posts come in, the layout collapses gracefully.
 */
export function MosaicGrid({
  posts,
  section,
  language,
  defaultFeatureImage,
}: SubProps) {
  const [hero, sideA, sideB, banner] = posts;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Row 1: hero (big-left) + 2 stacked side cards */}
      {(hero || sideA || sideB) && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {hero && (
            <div className="md:col-span-8">
              <MosaicHero
                post={hero}
                section={section}
                language={language}
                defaultFeatureImage={defaultFeatureImage}
              />
            </div>
          )}
          {(sideA || sideB) && (
            <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4 md:gap-6">
              {sideA && (
                <MosaicSide
                  post={sideA}
                  section={section}
                  language={language}
                  defaultFeatureImage={defaultFeatureImage}
                />
              )}
              {sideB && (
                <MosaicSide
                  post={sideB}
                  section={section}
                  language={language}
                  defaultFeatureImage={defaultFeatureImage}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Row 2: full-width banner */}
      {banner && (
        <MosaicBanner
          post={banner}
          section={section}
          language={language}
          defaultFeatureImage={defaultFeatureImage}
        />
      )}
    </div>
  );
}

// ── Mosaic card variants ────────────────────────────────────────

interface MosaicCardProps {
  post: PostListItem;
  section: RecentPostsSectionData;
  language: "en" | "mm";
  defaultFeatureImage?: string;
}

/** Big card — fills the left 8/12 column of row 1. Image-dominant
 *  with title baked into a bottom gradient. */
function MosaicHero({
  post,
  section,
  language,
  defaultFeatureImage,
}: MosaicCardProps) {
  const heroUrl = post.featuredImage?.url || defaultFeatureImage || "";
  const heroAlt =
    post.featuredImage?.alt?.[language] ||
    post.featuredImage?.alt?.en ||
    "";
  const title = post.title?.[language] || post.title?.en || "";
  const catLabel =
    section.showCategory !== false && post.categories?.[0]
      ? post.categories[0].title?.[language] ||
        post.categories[0].title?.en
      : null;
  const date =
    section.showDate !== false && post.publishedAt
      ? formatDate(post.publishedAt)
      : null;
  const excerpt =
    section.showExcerpt !== false
      ? post.excerpt?.[language] || post.excerpt?.en
      : null;

  return (
    <Link
      href={postHref(post)}
      className="group relative block aspect-[16/10] md:aspect-[4/3] overflow-hidden rounded-xl bg-muted"
    >
      {heroUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={heroUrl}
          alt={heroAlt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)",
          }}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
      />
      {catLabel && (
        <span className="absolute top-4 left-4 inline-flex items-center px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded bg-primary text-primary-foreground shadow-sm">
          {catLabel}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 text-white">
        <h3 className="font-bold text-xl md:text-2xl lg:text-3xl leading-snug line-clamp-3 drop-shadow-sm">
          {title}
        </h3>
        {excerpt && (
          <p className="text-sm mt-2 line-clamp-2 opacity-90">{excerpt}</p>
        )}
        {date && (
          <p className="text-[11px] mt-2 opacity-80 uppercase tracking-wider">
            {date}
          </p>
        )}
      </div>
    </Link>
  );
}

/** Side card — small image-above + text-below, used in the
 *  right column. Compact Stanford-style minimal card. */
function MosaicSide({
  post,
  section,
  language,
  defaultFeatureImage,
}: MosaicCardProps) {
  const heroUrl = post.featuredImage?.url || defaultFeatureImage || "";
  const heroAlt =
    post.featuredImage?.alt?.[language] ||
    post.featuredImage?.alt?.en ||
    "";
  const title = post.title?.[language] || post.title?.en || "";
  const catLabel =
    section.showCategory !== false && post.categories?.[0]
      ? post.categories[0].title?.[language] ||
        post.categories[0].title?.en
      : null;

  return (
    <Link
      href={postHref(post)}
      className="group flex flex-col h-full overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-md"
      style={{ borderColor: "#eef0f3" }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {heroUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={heroUrl}
            alt={heroAlt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)",
            }}
          />
        )}
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        {catLabel && (
          <span className="text-[10px] uppercase tracking-wider font-bold text-primary">
            {catLabel}
          </span>
        )}
        <h3 className="font-semibold text-base leading-snug line-clamp-3 group-hover:text-primary transition-colors">
          {title}
        </h3>
      </div>
    </Link>
  );
}

/** Banner — full-width row 2 card. Image on the left, content on
 *  the right (stacks vertically on mobile). */
function MosaicBanner({
  post,
  section,
  language,
  defaultFeatureImage,
}: MosaicCardProps) {
  const heroUrl = post.featuredImage?.url || defaultFeatureImage || "";
  const heroAlt =
    post.featuredImage?.alt?.[language] ||
    post.featuredImage?.alt?.en ||
    "";
  const title = post.title?.[language] || post.title?.en || "";
  const catLabel =
    section.showCategory !== false && post.categories?.[0]
      ? post.categories[0].title?.[language] ||
        post.categories[0].title?.en
      : null;
  const excerpt =
    section.showExcerpt !== false
      ? post.excerpt?.[language] || post.excerpt?.en
      : null;
  const date =
    section.showDate !== false && post.publishedAt
      ? formatDate(post.publishedAt)
      : null;

  return (
    <Link
      href={postHref(post)}
      className="group block overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-lg"
      style={{ borderColor: "#eef0f3" }}
    >
      <article className="grid grid-cols-1 md:grid-cols-2">
        <div className="relative aspect-[16/10] md:aspect-auto md:h-full overflow-hidden bg-muted">
          {heroUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={heroUrl}
              alt={heroAlt}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)",
              }}
            />
          )}
        </div>
        <div className="p-6 md:p-8 flex flex-col gap-3 justify-center">
          {catLabel && (
            <span className="text-[11px] uppercase tracking-wider font-bold text-primary">
              {catLabel}
            </span>
          )}
          <h3 className="font-bold text-xl md:text-2xl leading-snug line-clamp-3 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {excerpt && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {excerpt}
            </p>
          )}
          {date && (
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {date}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

/**
 * Duo layout — 2 hero spots arranged diagonally with paired
 * small cards filling the other two quadrants. 6 posts total.
 *
 *   ┌──────────────────┐  ┌────────┬────────┐
 *   │                  │  │        │        │
 *   │  POST 1 (hero)   │  │ POST 4 │ POST 5 │
 *   │                  │  │        │        │
 *   └──────────────────┘  └────────┴────────┘
 *   ┌────────┬─────────┐  ┌──────────────────┐
 *   │        │         │  │                  │
 *   │ POST 2 │ POST 3  │  │  POST 6 (hero)   │
 *   │        │         │  │                  │
 *   └────────┴─────────┘  └──────────────────┘
 *
 * Mobile: the four "cells" stack vertically so the diagonal
 * heroes still alternate with the small-pair groups.
 *
 * Graceful fallback — empty cells are simply omitted when fewer
 * than 6 posts are returned.
 */
export function DuoGrid({
  posts,
  section,
  language,
  defaultFeatureImage,
}: SubProps) {
  const [hero1, pairA1, pairA2, pairB1, pairB2, hero2] = posts;

  const renderHero = (post: PostListItem | undefined) =>
    post ? (
      <DuoHero
        post={post}
        section={section}
        language={language}
        defaultFeatureImage={defaultFeatureImage}
      />
    ) : null;

  const renderPair = (
    a: PostListItem | undefined,
    b: PostListItem | undefined,
  ) => {
    if (!a && !b) return null;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 h-full">
        {a && (
          <DuoSide
            post={a}
            section={section}
            language={language}
            defaultFeatureImage={defaultFeatureImage}
          />
        )}
        {b && (
          <DuoSide
            post={b}
            section={section}
            language={language}
            defaultFeatureImage={defaultFeatureImage}
          />
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {hero1 && <div>{renderHero(hero1)}</div>}
      {(pairA1 || pairA2) && <div>{renderPair(pairA1, pairA2)}</div>}
      {(pairB1 || pairB2) && <div>{renderPair(pairB1, pairB2)}</div>}
      {hero2 && <div>{renderHero(hero2)}</div>}
    </div>
  );
}

/**
 * Duo-specific Hero card — Stanford "In the Spotlight" style.
 *
 *  - Image fills the card edge-to-edge (4:3 aspect)
 *  - Dark gradient veil at the bottom keeps title legible
 *  - Eyebrow + title only (NO excerpt, NO date) — matches the
 *    minimalist Stanford editorial pattern
 *  - White text overlaid bottom-left
 *  - Hover: gentle image zoom
 */
function DuoHero({
  post,
  section,
  language,
  defaultFeatureImage,
}: MosaicCardProps) {
  const heroUrl = post.featuredImage?.url || defaultFeatureImage || "";
  const heroAlt =
    post.featuredImage?.alt?.[language] ||
    post.featuredImage?.alt?.en ||
    "";
  const title = post.title?.[language] || post.title?.en || "";
  const catLabel =
    section.showCategory !== false && post.categories?.[0]
      ? post.categories[0].title?.[language] ||
        post.categories[0].title?.en
      : null;
  const date =
    section.showDate !== false && post.publishedAt
      ? new Date(post.publishedAt)
      : null;

  return (
    <Link
      href={postHref(post)}
      // `aspect-[3/2]` matches Stanford's hero card ratio (~1.5:1
      // — wider than 4:3, less stretched than 16:9).
      className="group relative block aspect-[3/2] overflow-hidden rounded-md bg-muted"
    >
      {heroUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={heroUrl}
          alt={heroAlt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)",
          }}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
      />

      {/* Calendar-style date badge — top-left of the card on top of
           a frosted white pill. Month abbreviation in primary
           colour above the day number; matches the
           post-list ListView/CardView badge for cross-component
           consistency. */}
      {date && (
        <time
          dateTime={date.toISOString()}
          className="absolute top-3 left-3 inline-flex flex-col items-center px-2 py-1 rounded-md backdrop-blur-sm shadow-sm bg-white/92"
          style={{ minWidth: "44px" }}
          aria-label={date.toLocaleDateString()}
        >
          <span className="text-[10px] uppercase tracking-wider font-bold leading-none text-primary">
            {date.toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="text-lg font-bold leading-tight text-foreground">
            {date.getDate()}
          </span>
        </time>
      )}

      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 text-white">
        {catLabel && (
          <p className="text-[11px] uppercase tracking-[0.15em] font-bold mb-2 opacity-95">
            {catLabel}
          </p>
        )}
        <h3 className="text-base md:text-lg lg:text-xl leading-snug line-clamp-3 drop-shadow-sm">
          {title}
        </h3>
      </div>
    </Link>
  );
}

/**
 * Duo-specific Side card — Stanford small-card style.
 *
 *  - Image on top (4:3 aspect, full color, no overlay)
 *  - White panel below with eyebrow + title (NO excerpt, NO date)
 *  - No visible border; subtle shadow defines the card edge
 *  - Eyebrow in primary color (Stanford uses cardinal red here);
 *    title in foreground color, bold
 *  - Hover: subtle shadow lift + title color shift to primary
 */
function DuoSide({
  post,
  section,
  language,
  defaultFeatureImage,
}: MosaicCardProps) {
  const heroUrl = post.featuredImage?.url || defaultFeatureImage || "";
  const heroAlt =
    post.featuredImage?.alt?.[language] ||
    post.featuredImage?.alt?.en ||
    "";
  const title = post.title?.[language] || post.title?.en || "";
  const catLabel =
    section.showCategory !== false && post.categories?.[0]
      ? post.categories[0].title?.[language] ||
        post.categories[0].title?.en
      : null;
  const date =
    section.showDate !== false && post.publishedAt
      ? new Date(post.publishedAt)
      : null;

  return (
    <Link
      href={postHref(post)}
      className="group flex flex-col h-full overflow-hidden rounded-md bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {heroUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={heroUrl}
            alt={heroAlt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)",
            }}
          />
        )}
        {/* Calendar-style date badge — same look as DuoHero so the
             grid reads as a coherent set. Smaller padding because
             the side card's image area is smaller. */}
        {date && (
          <time
            dateTime={date.toISOString()}
            className="absolute top-2 left-2 inline-flex flex-col items-center px-1.5 py-0.5 rounded-md backdrop-blur-sm shadow-sm bg-white/92"
            style={{ minWidth: "38px" }}
            aria-label={date.toLocaleDateString()}
          >
            <span className="text-[9px] uppercase tracking-wider font-bold leading-none text-primary">
              {date.toLocaleDateString("en-US", { month: "short" })}
            </span>
            <span className="text-base font-bold leading-tight text-foreground">
              {date.getDate()}
            </span>
          </time>
        )}
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        {catLabel && (
          <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-primary">
            {catLabel}
          </p>
        )}
        <h3 className="text-sm md:text-base leading-snug line-clamp-3 text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
      </div>
    </Link>
  );
}

