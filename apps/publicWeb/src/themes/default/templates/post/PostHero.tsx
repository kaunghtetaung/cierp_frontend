import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface PostHeroProps {
  title?: string;
  excerpt?: string;
  featuredImageUrl?: string;
  /** Pre-built crumb chain (Home → [post type] → current). */
  crumbs?: Array<{ label: string; href?: string }>;
  /** Default-on; flip via `post.showTitle`. */
  showTitle?: boolean;
  showBreadcrumbs?: boolean;
  /**
   * Slot rendered next to the title — used by the post route to drop
   * in a `<DraftBadge>` when the visitor is previewing an unpublished
   * post. Kept generic so other status pills can ride the same slot.
   */
  titleAdornment?: React.ReactNode;
}

/**
 * Post-page hero — featured image as background with a dark overlay
 * for legibility, title + excerpt on top, breadcrumbs above the
 * title. Falls back to a solid muted band when no featured image is
 * set so layout doesn't collapse.
 *
 * Visual rhythm matches `themes/um1sf/templates/page/PageHeader`:
 * generous vertical padding, breadcrumb → title gap, max-w container.
 * Default theme uses neutral colors; um1sf override will swap in
 * theme-driven tokens.
 */
export function PostHero({
  title,
  excerpt,
  featuredImageUrl,
  crumbs,
  showTitle = true,
  showBreadcrumbs = true,
  titleAdornment,
}: PostHeroProps) {
  const hasImage = !!featuredImageUrl;
  const renderTitle = showTitle && (title || excerpt);
  const renderCrumbs = showBreadcrumbs && crumbs && crumbs.length > 0;
  if (!renderTitle && !renderCrumbs) return null;

  return (
    <header
      className="relative overflow-hidden border-b"
      style={{
        backgroundColor: hasImage ? "#1a1a1a" : "var(--color-muted, #f3f4f6)",
        color: hasImage ? "#fff" : "var(--color-foreground)",
      }}
    >
      {hasImage && (
        <>
          {/* Featured image — eslint disable because we read from
               arbitrary user URLs and don't want to bake every
               possible storage host into next.config.
               LCP optimization: eager-load + high fetch priority +
               async decode so the hero (typically the LCP element)
               doesn't block the largest-contentful-paint metric. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featuredImageUrl}
            alt=""
            aria-hidden
            loading="eager"
            decoding="async"
            // @ts-expect-error — fetchpriority is a valid attribute
            // not yet in React's typed HTMLAttributes (lands in the
            // experimental DOM types).
            fetchpriority="high"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark gradient overlay for title legibility — top is
               translucent so a faint outline is still visible, bottom
               sinks darker so the title reads cleanly. */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)",
            }}
          />
        </>
      )}

      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
        {renderCrumbs && (
          <nav
            aria-label="Breadcrumb"
            className={renderTitle ? "mb-5 md:mb-6" : ""}
          >
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs md:text-sm opacity-90">
              {crumbs!.map((c, i) => {
                const isLast = i === crumbs!.length - 1;
                return (
                  <li
                    key={`${i}-${c.label}`}
                    className="flex items-center gap-1.5"
                  >
                    {i > 0 && (
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    )}
                    {isLast || !c.href ? (
                      <span
                        className="font-medium inline-flex items-center gap-1"
                        aria-current={isLast ? "page" : undefined}
                      >
                        {i === 0 && (
                          <Home className="h-3.5 w-3.5 opacity-90" />
                        )}
                        {c.label}
                      </span>
                    ) : (
                      <Link
                        href={c.href}
                        className="inline-flex items-center gap-1 hover:underline underline-offset-4 decoration-1"
                      >
                        {i === 0 && (
                          <Home className="h-3.5 w-3.5 opacity-90" />
                        )}
                        {c.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        {renderTitle && (
          <div className="w-full">
            {titleAdornment && (
              <div className="mb-3 md:mb-4">{titleAdornment}</div>
            )}
            {title && (
              // `leading-relaxed` gives Myanmar diacritics vertical
              // room — `leading-snug` clipped stacked marks against
              // the line above. Caps at `lg:text-2xl` so xl/2xl
              // screens don't shout the heading.
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold leading-loose tracking-tight">
                {title}
              </h1>
            )}
            {excerpt && (
              <p className="mt-4 md:mt-5 text-base md:text-lg opacity-90 leading-relaxed">
                {excerpt}
              </p>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default PostHero;
