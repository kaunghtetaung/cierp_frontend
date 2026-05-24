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
  /** Default-theme variant. um1sf passes its own typed tokens. */
  className?: string;
}

/**
 * Right-rail sidebar for post-detail pages. Three optional widgets,
 * each rendered only when there's data:
 *   1. Categories of this post (links to /category/:slug)
 *   2. Tags of this post (links to /tag/:slug)
 *   3. Related posts (manual `relatedPostIds` or auto-suggested by
 *      tag/category overlap from the backend)
 *
 * Layout is content-only — outer padding/spacing comes from the page
 * template's column wrapper.
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
    <aside className={`space-y-6 ${className}`} aria-label="Post sidebar">
      {hasCategories && (
        <SidebarCard icon={Folder} title="Categories">
          <ul className="space-y-1.5 text-sm">
            {categories!.map((c) => (
              <li key={c._id}>
                <Link
                  href={`/category/${c.slug}`}
                  className="text-foreground hover:text-primary hover:underline underline-offset-2"
                >
                  {pickLabel(c.name, c.slug, currentLanguage)}
                </Link>
              </li>
            ))}
          </ul>
        </SidebarCard>
      )}

      {hasTags && (
        <SidebarCard icon={TagIcon} title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {tags!.map((t) => (
              <Link
                key={t._id}
                href={`/tags/${t.slug}`}
                className="inline-flex items-center px-2.5 py-1 rounded-full border bg-card text-xs text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {pickLabel(t.name, t.slug, currentLanguage)}
              </Link>
            ))}
          </div>
        </SidebarCard>
      )}

      {hasRelated && (
        <SidebarCard icon={BookOpen} title="Related posts">
          <ul className="space-y-3">
            {related!.map((p) => {
              const title =
                p.title?.[currentLanguage] || p.title?.en || `Post`;
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
                      className="w-16 h-16 object-cover rounded shrink-0 border"
                    />
                  )}
                  <div className="min-w-0">
                    <Link
                      href={href}
                      className="text-sm font-medium leading-snug hover:text-primary line-clamp-2"
                    >
                      {title}
                    </Link>
                    {excerpt && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {excerpt}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </SidebarCard>
      )}
    </aside>
  );
}

function SidebarCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <header className="flex items-center gap-2 mb-3 pb-2 border-b">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <h3 className="text-sm font-bold">{title}</h3>
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
