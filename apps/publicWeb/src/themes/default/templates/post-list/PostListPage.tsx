import React from "react";
import { PostHero } from "../post/PostHero";
import { PostSidebar } from "../post/PostSidebar";
import { CardView } from "./views/CardView";
import { ListView } from "./views/ListView";
import { TableView } from "./views/TableView";
import { ViewToggle, type ListViewMode } from "./ViewToggle";
import { PostListPagination } from "./PostListPagination";
import type { PostListItem } from "./helpers";
import { getMessages } from "../../lib/messages";

interface PostListPageProps {
  /** Heading shown in the hero (e.g. "Announcements", "News"). */
  title: string;
  /** Optional sub-heading / description text. */
  subtitle?: string;
  /** Crumbs from the route — `Home → [type]`. */
  crumbs?: Array<{ label: string; href?: string }>;
  /** Post-list items for the current page. */
  posts: PostListItem[];
  /** Total post count across all pages (for pagination math). */
  total: number;
  /** 1-indexed current page. */
  page: number;
  /** Items per page. */
  limit: number;
  /** Current view mode from `?view=`. */
  view?: ListViewMode;
  /** Site-wide taxonomy for the sidebar. */
  categories?: any[];
  tags?: any[];
  /** Used to build pagination hrefs. */
  pathname: string;
  /** Existing query params from the route. */
  searchParams: Record<string, string | string[] | undefined>;
  /** Post-type slug for href fallback (`/post/<type>/<slug>`). */
  fallbackType?: string;
  currentLanguage?: "en" | "mm";
  /** Site-wide fallback used when a post has no `featuredImage`. */
  defaultFeatureImage?: string;
}

/**
 * Default-theme post-list page — used for announcements, news,
 * article, lesson, and event index routes. Same layout regardless
 * of post type: hero band + 8/4 grid with content on left and the
 * shared sidebar on right + pagination.
 *
 * View modes are mutually exclusive (`list` / `card` / `table`)
 * controlled by `?view=` URL param. List is the default.
 *
 * Server component — no client state. View / page changes round-trip
 * through URL and re-render.
 */
export function PostListPage({
  title,
  subtitle,
  crumbs,
  posts,
  total,
  page,
  limit,
  view = "list",
  categories,
  tags,
  pathname,
  searchParams,
  fallbackType,
  currentLanguage = "en",
  defaultFeatureImage,
}: PostListPageProps) {
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  const t = getMessages(currentLanguage);

  return (
    <div className="w-full">
      <PostHero
        title={title}
        excerpt={subtitle}
        crumbs={crumbs}
        showTitle={true}
        showBreadcrumbs={true}
      />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <main className="lg:col-span-8 min-w-0">
            {/* Toolbar — total count + view toggle */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <p
                className="text-sm"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                {total === 0
                  ? t.postList.noPostsYet
                  : total === 1
                    ? t.postList.onePost
                    : `${total.toLocaleString()} ${t.postList.countSuffix}`}
                {totalPages > 1
                  ? ` · ${t.postList.pageSuffix} ${page} / ${totalPages}`
                  : ""}
              </p>
              <ViewToggle current={view} currentLanguage={currentLanguage} />
            </div>

            {posts.length === 0 ? (
              <div
                className="rounded-lg border border-dashed py-16 text-center"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-muted-foreground)",
                }}
              >
                <p className="text-base font-medium mb-1">
                  {t.postList.emptyTitle}
                </p>
                <p className="text-sm">{t.postList.emptyMessage}</p>
              </div>
            ) : view === "card" ? (
              <CardView
                posts={posts}
                currentLanguage={currentLanguage}
                fallbackType={fallbackType}
                defaultFeatureImage={defaultFeatureImage}
              />
            ) : view === "table" ? (
              <TableView
                posts={posts}
                currentLanguage={currentLanguage}
                fallbackType={fallbackType}
              />
            ) : (
              <ListView
                posts={posts}
                currentLanguage={currentLanguage}
                fallbackType={fallbackType}
                defaultFeatureImage={defaultFeatureImage}
              />
            )}

            <PostListPagination
              page={page}
              totalPages={totalPages}
              pathname={pathname}
              searchParams={searchParams}
            />
          </main>

          <div className="lg:col-span-4 lg:border-l lg:border-border lg:pl-10">
            <PostSidebar
              categories={categories}
              tags={tags}
              related={undefined}
              currentLanguage={currentLanguage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostListPage;
