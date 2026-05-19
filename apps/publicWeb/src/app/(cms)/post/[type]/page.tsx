import React from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getApiDomain } from "@repo/utils/server";
import { createHttpClient } from "@repo/api/client";
import { getContentSettings } from "@repo/content";
import { isKnownTheme } from "@repo/types";
import { getThemeTemplates, type ThemeName } from "@/themes";
import { ErrorPage } from "../../../../feature-components/error";
import type { ListViewMode } from "@/themes/default/templates/post-list/ViewToggle";

// Dynamic — pulls headers + per-tenant data + query params
export const dynamic = "force-dynamic";

interface PostTypePageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Public list page for a given post type — used for announcements,
 * news, article, lesson, event index routes. All share the same
 * layout (theme-resolved) with view toggle (list / card / table)
 * and pagination via URL query params.
 *
 * URL params:
 *   - `?view=list|card|table` — view mode (default `list`)
 *   - `?page=N`               — 1-indexed page (default 1)
 *   - `?limit=N`              — items per page (default 12, max 50)
 */

/** Site-wide taxonomy fetch — mirror of the one in the post detail
 *  route. Both pages render the same sidebar so they need the same
 *  data shape. */
async function fetchTaxonomy(
  tenantId: string,
  resource: "categories" | "tags",
  limit = 30,
): Promise<any[]> {
  try {
    const apiDomain = await getApiDomain();
    const httpClient = createHttpClient({
      baseURL: apiDomain,
      enableAuth: true,
      timeout: 10_000,
    });
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    // Anonymous taxonomy fetch — the /public sibling forces
    // status: 'Active' server-side so we don't need to send it.
    const response: any = await httpClient.request(
      `/content/${resource}/public?${params.toString()}`,
      { method: "GET", tenantId, withAuth: false },
    );
    if (!response?.success) return [];
    let data: any = response.data;
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      "data" in data
    ) {
      data = data.data;
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(
      `[PostTypePage] fetchTaxonomy(${resource}) failed:`,
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

/** Page-of-posts fetcher — hits the gateway list endpoint with
 *  postTypeSlug, status=Published, paging, and sort. */
async function fetchPostsPage(
  tenantId: string,
  postTypeSlug: string,
  page: number,
  limit: number,
): Promise<{ posts: any[]; total: number }> {
  try {
    const apiDomain = await getApiDomain();
    const httpClient = createHttpClient({
      baseURL: apiDomain,
      enableAuth: true,
      timeout: 10_000,
    });
    const params = new URLSearchParams();
    params.set("postTypeSlug", postTypeSlug);
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sortBy", "publishedAt");
    params.set("sortOrder", "desc");
    // Anonymous list endpoint: the /public sibling resolves postTypeSlug
    // server-side and force-pins status: 'Published' + visibility:
    // 'Public', so we drop the explicit status param and the auth token.
    const response: any = await httpClient.request(
      `/content/post/public?${params.toString()}`,
      { method: "GET", tenantId, withAuth: false },
    );
    if (!response?.success) return { posts: [], total: 0 };
    // The list endpoint wraps `{data: [...], meta: {total, ...}}`.
    // The response handler may pass that through or unwrap once;
    // accept either shape.
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
    const posts = Array.isArray(raw) ? raw : [];
    const total: number =
      typeof meta?.total === "number" ? meta.total : posts.length;
    return { posts, total };
  } catch (err) {
    console.warn(
      `[PostTypePage] fetchPostsPage failed:`,
      err instanceof Error ? err.message : err,
    );
    return { posts: [], total: 0 };
  }
}

function readNumber(
  value: string | string[] | undefined,
  fallback: number,
  min = 1,
  max = 9999,
): number {
  if (Array.isArray(value)) value = value[0];
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function readView(
  value: string | string[] | undefined,
): ListViewMode {
  if (Array.isArray(value)) value = value[0];
  if (value === "card" || value === "table") return value;
  return "list";
}

/** Title Case heading from the URL slug for known + unknown types. */
function getTypeLabel(type: string, language: "en" | "mm"): string {
  const KNOWN: Record<string, { en: string; mm: string }> = {
    announcements: { en: "Announcements", mm: "ကြေငြာချက်များ" },
    announcement: { en: "Announcements", mm: "ကြေငြာချက်များ" },
    news: { en: "News", mm: "သတင်းများ" },
    article: { en: "Articles", mm: "ဆောင်းပါးများ" },
    articles: { en: "Articles", mm: "ဆောင်းပါးများ" },
    events: { en: "Events", mm: "ပွဲများ" },
    event: { en: "Events", mm: "ပွဲများ" },
    lesson: { en: "Lessons", mm: "သင်ခန်းစာများ" },
    lessons: { en: "Lessons", mm: "သင်ခန်းစာများ" },
  };
  const hit = KNOWN[type.toLowerCase()];
  if (hit) return hit[language];
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default async function PostTypePage({
  params,
  searchParams,
}: PostTypePageProps) {
  const { type } = await params;
  const sp = await searchParams;

  try {
    const middleware = await getMiddlewareDataFromHeaders();
    const tenantId = middleware.tenantId;
    const currentLanguage = middleware.language as "en" | "mm";

    if (!tenantId) {
      return (
        <ErrorPage
          type="critical"
          title="Configuration Error"
          message="Unable to determine tenant configuration."
          showRetry={false}
        />
      );
    }

    let themeName: ThemeName = "default";
    let defaultFeatureImage: string | undefined;
    try {
      const contentSettings = await getContentSettings(tenantId);
      const candidate = (contentSettings as any)?.themeName;
      if (candidate && isKnownTheme(candidate)) {
        themeName = candidate as ThemeName;
      }
      // Site-wide fallback image for posts without their own
      // `featuredImage`. Authored in the admin Settings page; the
      // RecentPosts home-section reads from the same field.
      defaultFeatureImage =
        (contentSettings as any)?.defaultFeatureImage || undefined;
    } catch {
      // fall through to default
    }
    const { PostListPage } = getThemeTemplates(themeName);

    const page = readNumber(sp.page, 1, 1, 9999);
    const limit = readNumber(sp.limit, 12, 1, 50);
    const view = readView(sp.view);

    // Run all three fetches in parallel.
    const [{ posts, total }, categories, tags] = await Promise.all([
      fetchPostsPage(tenantId, type, page, limit),
      fetchTaxonomy(tenantId, "categories"),
      fetchTaxonomy(tenantId, "tags"),
    ]);

    const title = getTypeLabel(type, currentLanguage);
    const crumbs = [
      { label: currentLanguage === "mm" ? "ပင်မ" : "Home", href: "/" },
      { label: title },
    ];

    return (
      <PostListPage
        title={title}
        crumbs={crumbs}
        posts={posts as any[]}
        total={total}
        page={page}
        limit={limit}
        view={view}
        categories={categories}
        tags={tags}
        pathname={`/post/${type}`}
        searchParams={sp}
        fallbackType={type}
        currentLanguage={currentLanguage}
        defaultFeatureImage={defaultFeatureImage}
      />
    );
  } catch (error) {
    console.error("Error in PostTypePage:", error);
    return (
      <ErrorPage
        type="page"
        title="Error Loading List"
        message={`There was an error loading the "${type}" list.`}
        debugInfo={error instanceof Error ? error.message : String(error)}
      />
    );
  }
}
