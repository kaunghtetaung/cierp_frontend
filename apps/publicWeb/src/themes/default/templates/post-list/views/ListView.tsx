import React from "react";
import Link from "next/link";
import { Clock, Folder, Tag as TagIcon } from "lucide-react";
import {
  type PostListItem,
  formatDate,
  getAuthorName,
  getDate,
  getExcerpt,
  getFeaturedImageUrl,
  getPopulatedTaxonomy,
  getPostHref,
  getTitle,
  pickTaxonomyLabel,
} from "../helpers";
import { DraftBadge } from "@/feature-components/draft-badge/DraftBadge";

interface ListViewProps {
  posts: PostListItem[];
  currentLanguage?: "en" | "mm";
  fallbackType?: string;
  defaultFeatureImage?: string;
}

/**
 * Editorial list — each row is a card with rich meta. Design beats:
 *
 *  - Thumbnail with a calendar overlay badge (day + month) for fast
 *    chronological scanning.
 *  - Category eyebrow above the title (small caps, primary color).
 *  - Larger title, 2-line clamp.
 *  - Excerpt with 2-line clamp.
 *  - Footer row with author avatar (initials), reading time, tag
 *    chips. Right-side "Read →" affordance reveals on hover.
 *  - Subtle elevation on hover; thumbnail picture zooms gently.
 *  - Bands separated by spacing (not a hard divider line) for a
 *    cleaner editorial feel.
 *
 * Theme-neutral via CSS variables — same component renders in
 * default + um1sf with each theme's palette.
 */
export function ListView({
  posts,
  currentLanguage = "en",
  fallbackType,
  defaultFeatureImage,
}: ListViewProps) {
  if (!posts || posts.length === 0) return null;
  return (
    <ul className="space-y-5 md:space-y-6">
      {posts.map((post) => {
        const title = getTitle(post, currentLanguage);
        const excerpt = getExcerpt(post, currentLanguage);
        const img = getFeaturedImageUrl(post, defaultFeatureImage);
        const href = getPostHref(post, fallbackType);
        const date = getDate(post);
        const author = getAuthorName(post.createdBy);
        const initials = authorInitials(author);
        const cats = getPopulatedTaxonomy(post.categoryIds);
        const tags = getPopulatedTaxonomy(post.tagIds).slice(0, 3);
        const primaryCat = cats[0];
        const readMins =
          (post as any).readingTimeMinutes ??
          (post as any).stats?.readingTime?.minutes ??
          null;

        return (
          <li key={post._id}>
            <Link
              href={href}
              className="group block overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card, #fff)",
              }}
            >
              <article className="grid grid-cols-1 sm:grid-cols-[220px_1fr] md:grid-cols-[280px_1fr]">
                {/* Thumbnail with date overlay */}
                <div
                  className="relative aspect-[16/10] sm:aspect-auto sm:h-full overflow-hidden"
                  style={{ backgroundColor: "var(--color-muted, #f3f4f6)" }}
                >
                  {img ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={img}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)",
                      }}
                    />
                  )}
                  {/* Date badge — top-left, semi-opaque white with
                       primary-color month abbreviation. Provides
                       fast chronological scanning. */}
                  {date && (
                    <time
                      dateTime={date.toISOString()}
                      className="absolute top-3 left-3 inline-flex flex-col items-center px-2 py-1 rounded-md backdrop-blur-sm shadow-sm"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.92)",
                        minWidth: "44px",
                      }}
                      aria-label={formatDate(date, currentLanguage)}
                    >
                      <span
                        className="text-[10px] uppercase tracking-wider font-bold leading-none"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {date.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span
                        className="text-lg font-bold leading-tight"
                        style={{ color: "var(--color-foreground)" }}
                      >
                        {date.getDate()}
                      </span>
                    </time>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 md:p-6 flex flex-col gap-3">
                  {/* Category eyebrow */}
                  {primaryCat && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold"
                      style={{ color: "var(--color-primary)" }}
                    >
                      <Folder className="h-3 w-3" />
                      {pickTaxonomyLabel(
                        primaryCat.name,
                        primaryCat.slug,
                        currentLanguage,
                      )}
                    </span>
                  )}

                  {/* Title */}
                  <h3
                    className="font-bold text-lg md:text-xl leading-snug line-clamp-2 transition-colors"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    {(post as any).status === "Draft" && (
                      <DraftBadge
                        language={currentLanguage}
                        className="mr-2 align-middle"
                      />
                    )}
                    <span className="group-hover:text-[color:var(--color-primary)] transition-colors">
                      {title}
                    </span>
                  </h3>

                  {/* Excerpt */}
                  {excerpt && (
                    <p
                      className="text-sm leading-relaxed line-clamp-2"
                      style={{ color: "var(--color-muted-foreground)" }}
                    >
                      {excerpt}
                    </p>
                  )}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <TagIcon
                        className="h-3 w-3 opacity-70"
                        style={{ color: "var(--color-muted-foreground)" }}
                      />
                      {tags.map((t) => (
                        <span
                          key={t._id}
                          className="inline-flex items-center px-2 py-0.5 text-[10px] rounded-full border"
                          style={{
                            borderColor: "var(--color-border)",
                            color: "var(--color-muted-foreground)",
                          }}
                        >
                          {pickTaxonomyLabel(t.name, t.slug, currentLanguage)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer meta */}
                  <div
                    className="mt-auto pt-3 flex flex-wrap items-center justify-between gap-3 border-t"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div
                      className="flex items-center gap-2.5 text-xs"
                      style={{ color: "var(--color-muted-foreground)" }}
                    >
                      <span
                        className="inline-flex items-center justify-center h-7 w-7 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: "var(--color-primary)",
                          color: "var(--color-primary-foreground, #fff)",
                        }}
                        aria-hidden
                      >
                        {initials}
                      </span>
                      <span style={{ color: "var(--color-foreground)" }}>
                        {author}
                      </span>
                      {readMins != null && (
                        <span className="inline-flex items-center gap-1 ml-2">
                          <Clock className="h-3 w-3" />
                          {readMins} min
                        </span>
                      )}
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Read article
                      <ArrowRightLong />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Inline arrow that slides on hover — small flourish for the "Read"
 *  affordance. Pure SVG so no extra lucide-icon bundling. */
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

function authorInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default ListView;
