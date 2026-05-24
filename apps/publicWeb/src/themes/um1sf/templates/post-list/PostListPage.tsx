import React from "react";
import { PostHero } from "../post/PostHero";
import { PostSidebar } from "../post/PostSidebar";
import { CardView } from "@/themes/default/templates/post-list/views/CardView";
import { ListView } from "@/themes/default/templates/post-list/views/ListView";
import { TableView } from "@/themes/default/templates/post-list/views/TableView";
import { ViewToggle, type ListViewMode } from "@/themes/default/templates/post-list/ViewToggle";
import { PostListPagination } from "@/themes/default/templates/post-list/PostListPagination";
import type { PostListItem } from "@/themes/default/templates/post-list/helpers";

interface PostListPageProps {
  title: string;
  subtitle?: string;
  crumbs?: Array<{ label: string; href?: string }>;
  posts: PostListItem[];
  total: number;
  page: number;
  limit: number;
  view?: ListViewMode;
  categories?: any[];
  tags?: any[];
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
  fallbackType?: string;
  currentLanguage?: "en" | "mm";
  defaultFeatureImage?: string;
}

/**
 * um1sf post-list page — same structure / behaviour as the default
 * theme's PostListPage. Theme-specific PostHero and PostSidebar
 * pull in um1sf's primary-band hero and editorial sidebar styling.
 * Views, toggle, and pagination are imported from the default theme
 * (theme-neutral via CSS variables).
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
            <div
              className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <p
                className="text-sm"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                {total === 0
                  ? "No posts yet"
                  : total === 1
                    ? "1 post"
                    : `${total.toLocaleString()} posts`}
                {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
              </p>
              <ViewToggle current={view} />
            </div>

            {posts.length === 0 ? (
              <div
                className="rounded-lg border border-dashed py-16 text-center"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-muted-foreground)",
                }}
              >
                <p className="text-base font-medium mb-1">No posts to show</p>
                <p className="text-sm">
                  Nothing has been published in this section yet.
                </p>
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

          <div
            className="lg:col-span-4 lg:border-l lg:pl-10"
            style={{ borderColor: "var(--color-border)" }}
          >
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
