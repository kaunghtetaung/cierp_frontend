import React from "react";
import Link from "next/link";
import { Clock, Tag as TagIcon } from "lucide-react";
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

interface CardViewProps {
  posts: PostListItem[];
  currentLanguage?: "en" | "mm";
  fallbackType?: string;
  defaultFeatureImage?: string;
}

/**
 * Editorial card grid — same design language as the upgraded
 * ListView, adapted for a stacked 3-up layout.
 *
 *  - Large 16:9 thumbnail with hover zoom + dark gradient hover veil
 *  - Date overlay badge on the image (month + day)
 *  - Category eyebrow above the title (small caps, primary color)
 *  - Title with hover color shift to primary
 *  - Excerpt clamped to 3 lines
 *  - Tag chips below excerpt
 *  - Footer row: author avatar + name + reading time, "Read →"
 *    affordance fades in on hover
 *  - Card lift (`-translate-y-0.5`) + shadow on hover
 */
export function CardView({
  posts,
  currentLanguage = "en",
  fallbackType,
  defaultFeatureImage,
}: CardViewProps) {
  if (!posts || posts.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => {
        const title = getTitle(post, currentLanguage);
        const excerpt = getExcerpt(post, currentLanguage);
        const img = getFeaturedImageUrl(post, defaultFeatureImage);
        const href = getPostHref(post, fallbackType);
        const date = getDate(post);
        const author = getAuthorName(post.createdBy);
        const initials = authorInitials(author);
        const cats = getPopulatedTaxonomy(post.categoryIds);
        const tags = getPopulatedTaxonomy(post.tagIds).slice(0, 2);
        const primaryCat = cats[0];
        const readMins =
          (post as any).readingTimeMinutes ??
          (post as any).stats?.readingTime?.minutes ??
          null;

        return (
          <article key={post._id} className="group h-full">
            <Link
              href={href}
              className="flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card, #fff)",
              }}
            >
              {/* Thumbnail */}
              <div
                className="relative aspect-[16/9] overflow-hidden"
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
                {/* Subtle gradient veil that deepens on hover —
                     adds depth without competing with the image. */}
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.35) 100%)",
                  }}
                />

                {/* Date badge — same look as ListView for consistency */}
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
              <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Category eyebrow — Stanford-style small caps
                     positioned ABOVE the title (not overlaid on the
                     image). Primary color, wide letter-spacing for
                     editorial feel. Hides if no categories. */}
                {primaryCat && (
                  <p
                    className="text-[11px] uppercase tracking-[0.15em] font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {pickTaxonomyLabel(
                      primaryCat.name,
                      primaryCat.slug,
                      currentLanguage,
                    )}
                  </p>
                )}

                <h3
                  className="font-bold text-base md:text-lg leading-snug line-clamp-2 transition-colors"
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

                {excerpt && (
                  <p
                    className="text-sm leading-relaxed line-clamp-3 flex-1"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    {excerpt}
                  </p>
                )}

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

                {/* Footer */}
                <div
                  className="mt-auto pt-3 flex items-center justify-between gap-2 border-t"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div
                    className="flex items-center gap-2 text-xs min-w-0"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    <span
                      className="inline-flex items-center justify-center h-6 w-6 rounded-full text-[9px] font-bold shrink-0"
                      style={{
                        backgroundColor: "var(--color-primary)",
                        color: "var(--color-primary-foreground, #fff)",
                      }}
                      aria-hidden
                    >
                      {initials}
                    </span>
                    <span
                      className="truncate"
                      style={{ color: "var(--color-foreground)" }}
                    >
                      {author}
                    </span>
                    {readMins != null && (
                      <span className="inline-flex items-center gap-0.5 shrink-0">
                        <Clock className="h-3 w-3" />
                        {readMins}m
                      </span>
                    )}
                  </div>
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Read
                    <ArrowRightLong />
                  </span>
                </div>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}

function ArrowRightLong() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 12"
      className="h-3 w-4 transition-transform duration-200 group-hover:translate-x-1"
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

export default CardView;
