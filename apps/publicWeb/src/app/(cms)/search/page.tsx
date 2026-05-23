import React from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getApiDomain } from "@repo/utils/server";
import { resolveAuthMode } from "@repo/auth/session-fetch";
import { createHttpClient } from "@repo/api/client";
import { getContentSettings } from "@repo/content";
import { isKnownTheme } from "@repo/types";
import { getThemeTemplates, type ThemeName } from "@/themes";
import { ErrorPage } from "../../../feature-components/error";
import type { ListViewMode } from "@/themes/default/templates/post-list/ViewToggle";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Site-wide post search results page — URL `/search?q=<term>`.
 *
 * Submits anonymous queries to `/content/post/public?search=<term>`
 * which runs case-insensitive regex over title/body/excerpt across
 * both languages (en + mm). Same layout shell as /post/[type] and
 * /category/[cat]: theme-resolved `PostListPage` with hero +
 * pagination + sidebar.
 */

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
      `[SearchPage] fetchTaxonomy(${resource}) failed:`,
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

async function fetchSearchPage(
  tenantId: string,
  q: string,
  page: number,
  limit: number,
  language?: string,
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
    params.set("search", q);
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sortBy", "publishedAt");
    params.set("sortOrder", "desc");
    // Don't pin a language — backend searches BOTH en + mm when
    // `language` is omitted, which is what users expect from a
    // top-bar search box.
    if (language === "en" || language === "mm") {
      // Only set if explicitly requested via ?lang= override. Keeping
      // the param optional means the natural bilingual behavior is the
      // default.
      params.set("language", language);
    }
    if (auth.authenticated) {
      // See /content/post publicView contract — pins Published and
      // OR-adds the visitor's eligible drafts.
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
      `[SearchPage] fetchSearchPage failed:`,
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

function readString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const q = readString(sp.q).trim();

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
      defaultFeatureImage =
        (contentSettings as any)?.defaultFeatureImage || undefined;
    } catch {
      // fall through to default
    }
    const { PostListPage } = getThemeTemplates(themeName);

    const page = readNumber(sp.page, 1, 1, 9999);
    const limit = readNumber(sp.limit, 12, 1, 50);
    const view = readView(sp.view);
    const langOverride = readString(sp.lang);

    // Three parallel fetches; results are empty when q is blank so we
    // skip the post query in that case (saves a roundtrip and keeps
    // the "no query" state explicit).
    const [{ posts, total }, categories, tags] = await Promise.all([
      q
        ? fetchSearchPage(tenantId, q, page, limit, langOverride)
        : Promise.resolve({ posts: [] as any[], total: 0 }),
      fetchTaxonomy(tenantId, "categories"),
      fetchTaxonomy(tenantId, "tags"),
    ]);

    const heading =
      currentLanguage === "mm" ? "ရှာဖွေမှု ရလဒ်များ" : "Search Results";
    const subtitle = q
      ? currentLanguage === "mm"
        ? `"${q}" အတွက် ရလဒ် ${total} ခု`
        : `${total} result${total === 1 ? "" : "s"} for "${q}"`
      : currentLanguage === "mm"
        ? "ရှာဖွေရန် စကားလုံး ထည့်ပါ"
        : "Enter a search term";

    const crumbs = [
      { label: currentLanguage === "mm" ? "ပင်မ" : "Home", href: "/" },
      { label: heading },
    ];

    return (
      <PostListPage
        title={heading}
        subtitle={subtitle}
        crumbs={crumbs}
        posts={posts as any[]}
        total={total}
        page={page}
        limit={limit}
        view={view}
        categories={categories}
        tags={tags}
        pathname={`/search`}
        searchParams={sp}
        currentLanguage={currentLanguage}
        defaultFeatureImage={defaultFeatureImage}
      />
    );
  } catch (error) {
    console.error("Error in SearchPage:", error);
    return (
      <ErrorPage
        type="page"
        title="Error Loading Search"
        message={
          q
            ? `There was an error loading results for "${q}".`
            : "There was an error loading the search page."
        }
        debugInfo={error instanceof Error ? error.message : String(error)}
      />
    );
  }
}
