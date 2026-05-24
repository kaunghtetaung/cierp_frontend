import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RelatedPostRef {
  _id: string;
  slug: string;
  title?: { en?: string; mm?: string };
  excerpt?: { en?: string; mm?: string };
  featuredImage?: string | { url?: string };
  postTypeSlug?: string;
  publishedAt?: string;
}

interface RelatedPostsBlockProps {
  posts?: RelatedPostRef[];
  currentLanguage?: "en" | "mm";
  /** Override the section heading. Defaults to localized "Related posts". */
  title?: string;
  className?: string;
}

/**
 * "Related posts" block — rendered BELOW the article body so it
 * shows in both standard layout (sidebar visible) and full-width
 * layout (PDF / slides, sidebar hidden). Full container width,
 * 3-column grid on lg+, stacks on mobile.
 *
 * Renders nothing when `posts` is empty — caller doesn't need to
 * gate it.
 *
 * Theme-neutral: uses CSS variables (`--color-border`, `--color-card`,
 * `--color-foreground`, `--color-muted-foreground`, `--color-primary`)
 * so both default and um1sf themes pick up their own palette without
 * needing per-theme variants.
 */
export function RelatedPostsBlock({
  posts,
  currentLanguage = "en",
  title,
  className = "",
}: RelatedPostsBlockProps) {
  if (!posts || posts.length === 0) return null;

  const heading =
    title ?? (currentLanguage === "mm" ? "ဆက်စပ်ပို့စ်များ" : "Related posts");

  return (
    <section
      className={`mt-12 pt-10 border-t ${className}`}
      style={{ borderColor: "var(--color-border)" }}
      aria-label={heading}
    >
      <header className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">
          {heading}
        </h2>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((p) => {
          const t = p.title?.[currentLanguage] || p.title?.en || "Post";
          const ex = p.excerpt?.[currentLanguage] || p.excerpt?.en || "";
          const img =
            typeof p.featuredImage === "string"
              ? p.featuredImage
              : p.featuredImage?.url;
          const href = p.postTypeSlug
            ? `/post/${p.postTypeSlug}/${p.slug}`
            : `/post/${p.slug}`;
          const date = p.publishedAt ? new Date(p.publishedAt) : null;

          return (
            <article key={p._id} className="group">
              <Link
                href={href}
                className="block overflow-hidden border rounded-lg transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-card, #fff)",
                }}
              >
                {img ? (
                  <div
                    className="aspect-[16/9] overflow-hidden"
                    style={{ backgroundColor: "var(--color-muted, #f3f4f6)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : (
                  <div
                    className="aspect-[16/9]"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)",
                    }}
                  />
                )}

                <div className="p-4 md:p-5">
                  <h3
                    className="font-semibold text-base leading-snug line-clamp-2 mb-2"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    <span className="group-hover:underline underline-offset-2 decoration-1">
                      {t}
                    </span>
                  </h3>
                  {ex && (
                    <p
                      className="text-sm line-clamp-2 mb-3"
                      style={{ color: "var(--color-muted-foreground)" }}
                    >
                      {ex}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    {date ? (
                      <time
                        dateTime={date.toISOString()}
                        style={{ color: "var(--color-muted-foreground)" }}
                      >
                        {date.toLocaleDateString(
                          currentLanguage === "mm" ? "my-MM" : "en-US",
                          { year: "numeric", month: "short", day: "numeric" },
                        )}
                      </time>
                    ) : (
                      <span />
                    )}
                    <span
                      className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Read
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default RelatedPostsBlock;
