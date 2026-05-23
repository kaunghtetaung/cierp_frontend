"use server";

import { getApiDomain } from "@repo/utils/server";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { resolveAuthMode } from "@repo/auth/session-fetch";
import { createHttpClient } from "@repo/api/client";
import { RecentPostsSectionData } from "../types";
import { PostListItem } from "./RecentPostsLayouts";

export interface FetchPagedPostsResult {
  posts: PostListItem[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Fetch one page of posts for a Recent Posts section. Used by the
 * paginated client component on each page change. Mirrors the query
 * spec in `section.query` but lets the caller override the page index.
 *
 * Returns empty result on any failure (no tenant, network error,
 * gateway 4xx/5xx) so the UI degrades gracefully.
 */
export async function fetchRecentPostsPage(
  section: RecentPostsSectionData,
  page: number,
): Promise<FetchPagedPostsResult> {
  const empty: FetchPagedPostsResult = {
    posts: [],
    total: 0,
    page,
    totalPages: 0,
  };
  try {
    const middleware = await getMiddlewareDataFromHeaders();
    const tenantId = middleware.tenantId;
    if (!tenantId) return empty;

    const apiDomain = await getApiDomain();
    const auth = await resolveAuthMode();
    const q = section.query ?? { limit: 6, sort: "latest" };

    const { sortBy, sortOrder } =
      q.sort === "popular"
        ? { sortBy: "viewCount", sortOrder: "desc" as const }
        : { sortBy: "publishedAt", sortOrder: "desc" as const };

    const limit = q.limit ?? 6;
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("page", String(Math.max(1, page)));
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    if (q.postTypeSlug) params.set("postTypeSlug", q.postTypeSlug);
    if (q.featuredOnly) params.set("isFeatured", "true");
    if (q.categoryIds && q.categoryIds.length > 0) {
      params.set("categoryId", q.categoryIds[0]);
    }
    if (auth.authenticated) {
      // publicView=true on the auth endpoint pins Published AND
      // OR-includes the visitor's eligible drafts (sys / org / dept
      // admin scope). Lets admins preview their drafts in the home
      // recent-posts section without leaking drafts to ordinary
      // signed-in visitors.
      params.set("publicView", "true");
    }

    // Endpoint switches on session presence:
    //   - anonymous → /content/post/public (forces visibility=Public).
    //   - authenticated → /content/post; VisibilityInterceptor on the
    //     backend filters Private/Protected/Password rows per-visitor.
    const httpClient = createHttpClient({
      baseURL: apiDomain,
      enableAuth: auth.authenticated,
      timeout: 10_000,
    });
    const path = auth.authenticated
      ? `/content/post?${params.toString()}`
      : `/content/post/public?${params.toString()}`;
    const response: any = await httpClient.request(path, {
      method: "GET",
      tenantId,
      withAuth: auth.withAuth,
      ...(auth.authenticated ? { tokenStrategy: auth.tokenStrategy } : {}),
    });
    if (!response?.success) {
      console.warn(
        `RecentPosts paged fetch failed: ${response?.error ?? "unknown"}`,
      );
      return empty;
    }
    // Some response handlers preserve the `{data, meta}` envelope and
    // some unwrap it. Handle both.
    let raw: any = response.data;
    let meta: any = response.meta ?? {};
    if (
      raw &&
      typeof raw === "object" &&
      !Array.isArray(raw) &&
      "data" in raw &&
      ("meta" in raw || "pagination" in raw)
    ) {
      meta = raw.meta ?? raw.pagination ?? {};
      raw = raw.data;
    }
    const posts: PostListItem[] = Array.isArray(raw) ? raw : [];

    if (q.sort === "pinned") {
      posts.sort((a, b) => {
        const ap = (a as any)?.announcementContext?.pinned ? 1 : 0;
        const bp = (b as any)?.announcementContext?.pinned ? 1 : 0;
        return bp - ap;
      });
    }

    return {
      posts,
      total: typeof meta.total === "number" ? meta.total : posts.length,
      page: typeof meta.page === "number" ? meta.page : page,
      totalPages:
        typeof meta.totalPages === "number"
          ? meta.totalPages
          : Math.max(1, Math.ceil((meta.total ?? posts.length) / limit)),
    };
  } catch (err) {
    console.warn("RecentPosts paged fetch failed", err);
    return empty;
  }
}
