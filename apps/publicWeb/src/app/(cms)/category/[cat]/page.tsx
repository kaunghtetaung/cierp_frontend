import React from "react";
import { notFound } from "next/navigation";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getApiDomain } from "@repo/utils/server";
import { resolveAuthMode } from "@repo/auth/session-fetch";
import { createHttpClient } from "@repo/api/client";
import { getContentSettings } from "@repo/content";
import { isKnownTheme } from "@repo/types";
import { getThemeTemplates, type ThemeName } from "@/themes";
import { ErrorPage } from "../../../../feature-components/error";
import type { ListViewMode } from "@/themes/default/templates/post-list/ViewToggle";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ cat: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Public list page for a single category — URL `/category/<slug>`.
 * Mirrors the layout of `/post/[type]` but filters by `categoryId`
 * (resolved from the slug) instead of `postTypeSlug`.
 */

async function fetchCategoryBySlug(
  tenantId: string,
  slug: string,
): Promise<any | null> {
  try {
    const apiDomain = await getApiDomain();
    const httpClient = createHttpClient({
      baseURL: apiDomain,
      enableAuth: true,
      timeout: 10_000,
    });
    const response: any = await httpClient.request(
      `/content/categories/slug/${encodeURIComponent(slug)}/public`,
      { method: "GET", tenantId, withAuth: false },
    );
    if (!response?.success) return null;
    let data: any = response.data;
    if (data && typeof data === "object" && "data" in data && !("_id" in data) && !("id" in data)) {
      data = data.data;
    }
    return data || null;
  } catch (err) {
    console.warn(
      `[CategoryPage] fetchCategoryBySlug(${slug}) failed:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

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
      `[CategoryPage] fetchTaxonomy(${resource}) failed:`,
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

async function fetchPostsByCategory(
  tenantId: string,
  categoryId: string,
  page: number,
  limit: number,
): Promise<{ posts: any[]; total: number }> {
  try {
    const apiDomain = await getApiDomain();
    const auth = await resolveAuthMode();
    const httpClient = createHttpClient({
      baseURL: apiDomain,
      enableAuth: true,
      timeout: 10_000,
    });
    const params = new URLSearchParams();
    params.set("categoryId", categoryId);
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sortBy", "publishedAt");
    params.set("sortOrder", "desc");
    if (auth.authenticated) {
      // publicView=true → backend pins Published + OR-includes the
      // visitor's eligible drafts (sys / org / dept-admin scope).
      params.set("publicView", "true");
    }
    const endpoint = auth.authenticated
      ? `/content/post?${params.toString()}`
      : `/content/post/public?${params.toString()}`;
    const response: any = await httpClient.request(
      endpoint,
      {
        method: "GET",
        tenantId,
        withAuth: auth.withAuth,
        ...(auth.authenticated ? { tokenStrategy: auth.tokenStrategy } : {}),
      },
    );
    if (!response?.success) return { posts: [], total: 0 };
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
      `[CategoryPage] fetchPostsByCategory failed:`,
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

function readView(value: string | string[] | undefined): ListViewMode {
  if (Array.isArray(value)) value = value[0];
  if (value === "card" || value === "table") return value;
  return "list";
}

function pickCategoryLabel(
  category: any,
  language: "en" | "mm",
  fallbackSlug: string,
): string {
  if (!category) return fallbackSlug;
  const name = category.name;
  if (name && typeof name === "object") {
    return name[language] || name.en || name.mm || fallbackSlug;
  }
  if (typeof name === "string" && name) return name;
  if (typeof category.title === "string" && category.title) return category.title;
  return fallbackSlug;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { cat } = await params;
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

    const category = await fetchCategoryBySlug(tenantId, cat);
    if (!category) {
      notFound();
    }
    const categoryId: string =
      category._id || category.id || category.categoryId;
    if (!categoryId) {
      notFound();
    }

    let themeName: ThemeName = "default";
    let defaultFeatureImage: string | undefined;
    try {
      const contentSettings = await getContentSettings(tenantId);
      const candidate = (contentSettings as any)?.themeName;
      if (candidate && isKnownTheme(candidate)) {
        themeName = candidate as ThemeName;
      }
      defaultFeatureImage =
        (contentSettings as any)?.defaultFeatureImage || undefined;
    } catch {
      // fall through to default
    }
    const { PostListPage } = getThemeTemplates(themeName);

    const page = readNumber(sp.page, 1, 1, 9999);
    const limit = readNumber(sp.limit, 12, 1, 50);
    const view = readView(sp.view);

    const [{ posts, total }, categories, tags] = await Promise.all([
      fetchPostsByCategory(tenantId, categoryId, page, limit),
      fetchTaxonomy(tenantId, "categories"),
      fetchTaxonomy(tenantId, "tags"),
    ]);

    const title = pickCategoryLabel(category, currentLanguage, cat);
    const crumbs = [
      { label: currentLanguage === "mm" ? "ပင်မ" : "Home", href: "/" },
      {
        label: currentLanguage === "mm" ? "အမျိုးအစားများ" : "Categories",
      },
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
        pathname={`/category/${cat}`}
        searchParams={sp}
        currentLanguage={currentLanguage}
        defaultFeatureImage={defaultFeatureImage}
      />
    );
  } catch (error: any) {
    // notFound() throws — let Next.js handle it instead of catching
    // as a generic error. Next.js 15+ digest is
    // `NEXT_HTTP_ERROR_FALLBACK;<status>`; older was `NEXT_NOT_FOUND`.
    const digest = typeof error?.digest === "string" ? error.digest : "";
    const message = typeof error?.message === "string" ? error.message : "";
    if (
      digest.startsWith("NEXT_NOT_FOUND") ||
      digest.startsWith("NEXT_HTTP_ERROR_FALLBACK") ||
      digest.startsWith("NEXT_REDIRECT") ||
      message.startsWith("NEXT_HTTP_ERROR_FALLBACK") ||
      message === "NEXT_NOT_FOUND"
    ) {
      throw error;
    }
    console.error("Error in CategoryPage:", error);
    return (
      <ErrorPage
        type="page"
        title="Error Loading Category"
        message={`There was an error loading the "${cat}" category.`}
        debugInfo={error instanceof Error ? error.message : String(error)}
      />
    );
  }
}
