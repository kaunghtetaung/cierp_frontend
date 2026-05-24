import React from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getContentSettings } from "@repo/content";
import { RecentPostsSectionData, SectionProps } from "../types";
import { RecentPostsHeader, RenderPosts } from "./RecentPostsLayouts";
import { fetchRecentPostsPage } from "./actions";
import { RecentPostsPaginated } from "./RecentPostsPaginated";

/**
 * Recent Posts Section — dynamic widget. Reads `section.query` (post-type
 * slug, categories, sort, limit) at render time, fetches matching
 * published posts from the content gateway, and renders them in the
 * configured layout (`grid` / `list` / `compact`).
 *
 * Two modes:
 *   - **Static** (`enablePaging` off, default): pure Server Component
 *     — fetches once, renders, done. SSR-friendly.
 *   - **Paginated** (`enablePaging` on): Server Component fetches the
 *     first page (so first paint still has data for SEO/perf), then
 *     hands off to a Client Component that owns page state and
 *     re-fetches via a Server Action on Prev/Next.
 *
 * Failure modes (no tenant, network error, empty result) are silenced
 * with a small fallback rather than blocking the page.
 */
export async function RecentPostsSection({
  section,
  currentLanguage = "en",
}: SectionProps<RecentPostsSectionData>) {
  // Resolve the site-wide default feature image up front so card
  // layouts can fall back to it when a post has no `featuredImage`
  // of its own. Read alongside the post fetch so the section renders
  // once with everything settled.
  const middleware = await getMiddlewareDataFromHeaders().catch(
    () => null,
  );
  const tenantId = middleware?.tenantId;
  const [initial, settings] = await Promise.all([
    fetchRecentPostsPage(section, 1),
    tenantId
      ? getContentSettings(tenantId).catch(() => null)
      : Promise.resolve(null),
  ]);
  const defaultFeatureImage =
    (settings as any)?.defaultFeatureImage || undefined;

  // Paginated mode — hand off to the Client Component, passing the
  // server-rendered first page as `initial` so the first paint isn't
  // empty.
  if (section.enablePaging) {
    return (
      <RecentPostsPaginated
        section={section}
        currentLanguage={currentLanguage}
        initial={initial}
        defaultFeatureImage={defaultFeatureImage}
      />
    );
  }

  // Static mode — render directly server-side.
  return (
    <section
      className="py-12 md:py-16"
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <RecentPostsHeader section={section} language={currentLanguage} />
        <RenderPosts
          posts={initial.posts}
          section={section}
          language={currentLanguage}
          defaultFeatureImage={defaultFeatureImage}
        />
      </div>
    </section>
  );
}

export default RecentPostsSection;
