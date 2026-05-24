import React from "react";
import Link from "next/link";
import { Folder, Tag as TagIcon, BookOpen } from "lucide-react";

interface CategoryRef {
  _id: string;
  slug: string;
  name?: { en?: string; mm?: string } | string;
}
interface TagRef {
  _id: string;
  slug: string;
  name?: { en?: string; mm?: string } | string;
}
interface RelatedPostRef {
  _id: string;
  slug: string;
  title?: { en?: string; mm?: string };
  excerpt?: { en?: string; mm?: string };
  featuredImage?: string | { url?: string };
  postTypeSlug?: string;
}

interface PostSidebarProps {
  categories?: CategoryRef[];
  tags?: TagRef[];
  related?: RelatedPostRef[];
  currentLanguage?: "en" | "mm";
  className?: string;
}

/**
 * um1sf post-page sidebar — same widget set as the default theme
 * (categories / tags / related posts) but rendered with um1sf
 * editorial styling: thin border + small-caps section headers,
 * primary-color accents on links, sharper hover states. Each card
 * paints minimal chrome so the band-stripe page background reads
 * through.
 */
export function PostSidebar({
  categories,
  tags,
  related,
  currentLanguage = "en",
  className = "",
}: PostSidebarProps) {
  const hasCategories = (categories?.length ?? 0) > 0;
  const hasTags = (tags?.length ?? 0) > 0;
  const hasRelated = (related?.length ?? 0) > 0;
  if (!hasCategories && !hasTags && !hasRelated) return null;

  return (
    <aside className={`space-y-8 ${className}`} aria-label="Post sidebar">
      {hasCategories && (
        <SidebarBlock icon={Folder} title="Categories">
          <ul className="space-y-2 text-sm">
            {categories!.map((c) => (
              <li key={c._id}>
                <Link
                  href={`/category/${c.slug}`}
                  className="hover:underline underline-offset-2"
                  style={{ color: "var(--color-foreground)" }}
                >
                  <span className="hover:text-[color:var(--color-primary)]">
                    {pickLabel(c.name, c.slug, currentLanguage)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SidebarBlock>
      )}

      {hasTags && (
        <SidebarBlock icon={TagIcon} title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {tags!.map((t) => (
              <Link
                key={t._id}
                href={`/tags/${t.slug}`}
                className="inline-flex items-center px-2.5 py-1 text-xs border transition-colors"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              >
                <span className="hover:text-[color:var(--color-primary)]">
                  {pickLabel(t.name, t.slug, currentLanguage)}
                </span>
              </Link>
            ))}
          </div>
        </SidebarBlock>
      )}

      {hasRelated && (
        <SidebarBlock icon={BookOpen} title="Related posts">
          <ul className="space-y-4">
            {related!.map((p) => {
              const title =
                p.title?.[currentLanguage] || p.title?.en || "Post";
              const excerpt =
                p.excerpt?.[currentLanguage] || p.excerpt?.en || "";
              const img =
                typeof p.featuredImage === "string"
                  ? p.featuredImage
                  : p.featuredImage?.url;
              const href = p.postTypeSlug
                ? `/post/${p.postTypeSlug}/${p.slug}`
                : `/post/${p.slug}`;
              return (
                <li
                  key={p._id}
                  className="flex items-start gap-3 group"
                >
                  {img && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={img}
                      alt=""
                      aria-hidden
                      className="w-16 h-16 object-cover shrink-0 border"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  )}
                  <div className="min-w-0">
                    <Link
                      href={href}
                      className="text-sm font-semibold leading-snug line-clamp-2 hover:underline underline-offset-2"
                      style={{ color: "var(--color-foreground)" }}
                    >
                      {title}
                    </Link>
                    {excerpt && (
                      <p
                        className="text-xs mt-1 line-clamp-2"
                        style={{
                          color: "var(--color-muted-foreground)",
                        }}
                      >
                        {excerpt}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </SidebarBlock>
      )}
    </aside>
  );
}

function SidebarBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header
        className="flex items-center gap-2 mb-3 pb-2 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Icon
          className="h-3.5 w-3.5"
          style={{ color: "var(--color-primary)" }}
        />
        <h3
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: "var(--color-foreground)" }}
        >
          {title}
        </h3>
      </header>
      {children}
    </section>
  );
}

function pickLabel(
  name: { en?: string; mm?: string } | string | undefined,
  fallback: string,
  language: "en" | "mm",
): string {
  if (typeof name === "string") return name;
  return name?.[language] || name?.en || fallback;
}

export default PostSidebar;
