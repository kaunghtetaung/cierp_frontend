"use client";

import React, { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { RecentPostsSectionData } from "../types";
import {
  PostListItem,
  RecentPostsHeader,
  RenderPosts,
} from "./RecentPostsLayouts";
import {
  fetchRecentPostsPage,
  FetchPagedPostsResult,
} from "./actions";

interface RecentPostsPaginatedProps {
  section: RecentPostsSectionData;
  currentLanguage?: "en" | "mm";
  /** Initial page payload — fetched server-side so first paint has data. */
  initial: FetchPagedPostsResult;
  /** Site-wide fallback featured image (Settings.defaultFeatureImage). */
  defaultFeatureImage?: string;
}

/**
 * Client variant of the Recent Posts section. Holds page state and
 * re-fetches via a server action on Prev/Next. The first page comes
 * from the server-rendered `initial` prop so the section is not
 * client-rendered for SEO-critical content; only subsequent page
 * changes go through the action.
 */
export function RecentPostsPaginated({
  section,
  currentLanguage = "en",
  initial,
  defaultFeatureImage,
}: RecentPostsPaginatedProps) {
  const [page, setPage] = useState(initial.page || 1);
  const [posts, setPosts] = useState<PostListItem[]>(initial.posts);
  const [totalPages, setTotalPages] = useState(initial.totalPages || 1);
  const [total, setTotal] = useState(initial.total || initial.posts.length);
  const [isPending, startTransition] = useTransition();

  // Reset to initial state if the section config (query) changes
  // upstream — e.g. when the same component is reused with a
  // different section after a route remount.
  useEffect(() => {
    setPage(initial.page || 1);
    setPosts(initial.posts);
    setTotalPages(initial.totalPages || 1);
    setTotal(initial.total || initial.posts.length);
  }, [initial]);

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages || next === page || isPending) return;
    startTransition(async () => {
      const result = await fetchRecentPostsPage(section, next);
      setPosts(result.posts);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotal(result.total);
      // Scroll the section back into view so the new page is visible
      // without the user having to scroll up manually.
      const el = document.querySelector(
        `[data-section-id="${section._id}"]`,
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  return (
    <section
      className="py-12 md:py-16"
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <RecentPostsHeader section={section} language={currentLanguage} />

        <div className={isPending ? "opacity-60 transition-opacity" : ""}>
          <RenderPosts
            posts={posts}
            section={section}
            language={currentLanguage}
            defaultFeatureImage={defaultFeatureImage}
          />
        </div>

        {totalPages > 1 && (
          <nav
            className="mt-8 flex items-center justify-center gap-2"
            aria-label="Recent posts pagination"
          >
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1 || isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <span className="text-xs text-muted-foreground px-3">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin inline" />
              ) : (
                <>
                  Page {page} of {totalPages}
                  {total > 0 && (
                    <span className="hidden sm:inline">
                      {" "}
                      · {total} total
                    </span>
                  )}
                </>
              )}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages || isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}

export default RecentPostsPaginated;
