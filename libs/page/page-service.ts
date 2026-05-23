// Page service for reading pages by slug - Read-only API
import { cache } from "react";
import { headers } from "next/headers";
import { getApiDomain } from "@repo/utils/server";
import { resolveAuthMode } from "@repo/auth/session-fetch";
import { createHttpClient } from "@repo/api/client";
import { getCacheInstance, CacheKeys, CacheTTL } from "@repo/cache";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import type { ApiResponse } from "@repo/types";
import type { SectionData, MultiLanguageText } from "@repo/types";

export interface PageSEO {
  title?: string;
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  twitterSite?: string;
  twitterCreator?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

export interface LayoutSettings {
  type: "blank" | "fluid" | "boxed";
  background?: {
    type: "solid" | "gradient" | "image";
    value: string;
  };
  className?: string;
}

export interface PageData {
  _id: string;
  title: MultiLanguageText;
  slug: string;
  content?: MultiLanguageText;
  excerpt?: MultiLanguageText;
  sections: SectionData[];
  organizationId: {
    _id: string;
    fullName: string;
    shortName: string;
  };
  departmentId?: string | null;
  status: "Draft" | "Published" | "Archived";
  publishedAt?: string;
  featuredImage?: string;
  seo?: PageSEO;
  template?: string;
  layout?: LayoutSettings;
  viewCount: number;
  isHomePage: boolean;
  isPublic: boolean;
  version: number;
  createdBy: { _id: string; email: string };
  updatedBy?: { _id: string; email: string };
  publishedBy?: string;
  deletedBy?: string;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export class PageService {
  private httpClient;
  private cache = getCacheInstance();

  constructor(baseURL: string) {
    this.httpClient = createHttpClient({
      baseURL,
      enableAuth: true,
      enableCSRF: false, // Page API doesn't need CSRF
      timeout: 10000, // 10 second timeout for server requests
    });
  }

  /**
   * Get page by slug for current tenant (read-only).
   *
   * Resolution order:
   *   1. **Posts collection** (page-as-post: `postTypeSlug='page'`) —
   *      this is the canonical home for newly authored pages. The
   *      admin uses `PostForm` and stores in `posts`.
   *   2. **Legacy `pages` collection** — kept as a backward-compat
   *      reader for orgs that haven't migrated yet. Hit only when the
   *      post-side lookup misses.
   *
   * Same slug can exist in both collections — the post wins, since
   * that's where active authoring happens.
   */
  async getPageBySlug(slug: string): Promise<PageData> {
    // Get tenant ID from headers
    const middlewareData = await getMiddlewareDataFromHeaders();
    const tenantId = middlewareData.tenantId;

    if (!tenantId) {
      throw new Error("No tenant ID found in request headers");
    }

    // Tier 1 — page-as-post lookup. Run BEFORE the cache check so a
    // stale legacy entry from before the post-as-page migration can't
    // shadow the canonical doc. Cache key bumped to `:v2` so any old
    // legacy values (different layout shape) are abandoned wholesale.
    //
    // Route through `httpClient.request` so auth (`Bearer <token>`)
    // and tenant headers are attached the same way the legacy lookup
    // does. The post controller returns the doc unwrapped (no
    // `{statusCode, data}` envelope), so we accept either shape from
    // the response handler.
    // Session-aware path selection. Anonymous visitors hit
    // `/content/post/slug/:slug/public` (forces visibility=Public
    // server-side). Authenticated visitors hit the bare
    // `/content/post/slug/:slug`, which runs through
    // VisibilityInterceptor and may surface Private (owner-only) /
    // Protected (role/group/user-scoped) docs the requester is
    // entitled to. We bypass the slug cache for authenticated reads
    // because the result is per-user and caching it would leak
    // role-scoped content between sessions.
    const auth = await resolveAuthMode();
    const cacheKey = `${CacheKeys.pageBySlug(tenantId, slug)}:v2`;
    const allowCache = !auth.authenticated;

    try {
      const tier1Path = auth.authenticated
        ? `/content/post/slug/${encodeURIComponent(slug)}`
        : `/content/post/slug/${encodeURIComponent(slug)}/public`;
      console.log(
        `📄 Page Service - Tier 1 (post-as-page) request: ${tier1Path}` +
          ` (auth=${auth.authenticated})`,
      );
      const postResp: any = await this.httpClient.request(tier1Path, {
        method: "GET",
        tenantId,
        withAuth: auth.withAuth,
        ...(auth.tokenStrategy ? { tokenStrategy: auth.tokenStrategy } : {}),
      });
      // The handler may wrap or pass through. Walk both shapes.
      const candidate =
        (postResp && postResp.data && (postResp.data as any)._id)
          ? postResp.data
          : (postResp && (postResp as any)._id)
            ? (postResp as any)
            : null;
      if (candidate) {
        const slugFromPostType =
          typeof (candidate as any).postTypeSlug === "string"
            ? (candidate as any).postTypeSlug
            : (candidate as any).postTypeId?.slug;
        if (!slugFromPostType || slugFromPostType === "page") {
          console.log(
            `📄 Page Service - Tier 1 hit: post-as-page _id=${(candidate as any)._id}`,
          );
          if (allowCache && this.isValidPageData(candidate)) {
            await this.cache.set(
              cacheKey,
              candidate as PageData,
              CacheTTL.CONTENT || 60 * 60 * 24,
            );
          }
          return candidate as PageData;
        }
      }
      console.log(
        `📄 Page Service - Tier 1 miss for slug='${slug}', falling back to legacy /page endpoint`,
      );
    } catch (err) {
      console.warn(
        `📄 Page Service - post-as-page fetch failed, falling back:`,
        err instanceof Error ? err.message : err,
      );
    }

    // Try to get from cache (post-as-page miss → legacy lookup path).
    // Skip the cache for authenticated reads — caching role-scoped
    // responses would leak Private/Protected content across sessions.
    if (allowCache) {
      const cachedPage = await this.cache.get<PageData>(cacheKey);
      if (cachedPage && this.isValidPageData(cachedPage)) {
        return cachedPage;
      }
    }

    // Fetch from API using HTTP client with tenant context - with token retry
    let lastError: Error | null = null;
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const tier2Path = auth.authenticated
          ? `/content/page/slug/${slug}`
          : `/content/page/slug/${slug}/public`;
        console.log(
          `📄 Page Service - Making API request (attempt ${attempt}/${maxRetries}) to: ${tier2Path} (auth=${auth.authenticated})`,
        );

        // Same session-aware switch as Tier 1 — authenticated reads
        // go through the bare endpoint with VisibilityInterceptor.
        const response: ApiResponse<PageData> = await this.httpClient.request(
          tier2Path,
          {
            method: "GET",
            tenantId,
            withAuth: auth.withAuth,
            ...(auth.tokenStrategy ? { tokenStrategy: auth.tokenStrategy } : {}),
          }
        );

        console.log(`📄 Page Service - API response received:`, {
          success: response.success,
          hasData: !!response.data,
          error: response.error,
          attempt,
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to fetch page");
        }

        const pageData = response.data;

        // Validate and cache the result (anonymous reads only — see
        // earlier comment on `allowCache`).
        if (allowCache && this.isValidPageData(pageData)) {
          await this.cache.set(
            cacheKey,
            pageData,
            CacheTTL.CONTENT || 60 * 60 * 24
          );
          console.log(
            `📄 Page Service - Page cached successfully for: ${slug}`
          );
        } else {
          console.warn(
            `📄 Page Service - Invalid page data received for: ${slug}`
          );
        }

        return pageData;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.error(
          `📄 Page Service - Error on attempt ${attempt}:`,
          lastError.message
        );

        // If it's a token error and we have retries left, continue to retry
        if (
          lastError.message.includes("Token has expired") &&
          attempt < maxRetries
        ) {
          console.log(
            `📄 Page Service - Token expired, retrying... (attempt ${
              attempt + 1
            }/${maxRetries})`
          );
          // Small delay before retry to allow token refresh
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        // If it's not a token error or we're out of retries, break
        break;
      }
    }

    // If we get here, all retries failed
    console.error(
      `📄 Page Service - All attempts failed for page "${slug}":`,
      lastError?.message
    );
    throw new Error(
      `Failed to fetch page "${slug}": ${lastError?.message || "Unknown error"}`
    );
  }

  /**
   * Validate that page data is complete and valid
   */
  private isValidPageData(data: any): data is PageData {
    return (
      data &&
      typeof data === "object" &&
      data._id &&
      data.slug &&
      data.title &&
      typeof data.title === "object" &&
      data.title.en &&
      data.organizationId &&
      Array.isArray(data.sections)
    );
  }

  /**
   * Get page meta information for SEO
   */
  async getPageMeta(slug: string): Promise<{
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  }> {
    const page = await this.getPageBySlug(slug);
    return {
      title: page.seo?.title || page.title.en,
      description: page.seo?.description || page.excerpt?.en,
      keywords: page.seo?.keywords,
      ogImage: page.seo?.ogImage || page.featuredImage,
    };
  }

  /**
   * Check if page is published and public
   */
  async isPageAccessible(slug: string): Promise<boolean> {
    try {
      const page = await this.getPageBySlug(slug);
      return page.status === "Published" && page.isPublic;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get page sections that are enabled.
   *
   * Defensive — `sections` may be undefined when the legacy page
   * collection migrated to Posts (postType=page) and a stale doc
   * lacks the field, or when the backend returns a page that has
   * no sections at all. Treat missing/non-array as "no sections".
   */
  async getPageSections(slug: string): Promise<SectionData[]> {
    const page = await this.getPageBySlug(slug);
    const sections = Array.isArray(page?.sections) ? page.sections : [];
    return sections
      .filter((section) => section.isVisible)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
}

/**
 * Get page by slug using React.cache for request-level deduplication
 * This is the single source of truth for page data
 */
export const getPageBySlug = cache(async (slug: string): Promise<PageData> => {
  const apiUrl = await getApiDomain();
  const pageService = new PageService(apiUrl);

  console.log(
    `📄 Fetching page by slug: ${slug} from: ${apiUrl} (tenantId extracted from headers)`
  );

  return await pageService.getPageBySlug(slug);
});

/**
 * Get page meta information using React.cache
 */
export const getPageMeta = cache(
  async (
    slug: string
  ): Promise<{
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  }> => {
    const page = await getPageBySlug(slug);
    return {
      title: page.seo?.title || page.title.en,
      description: page.seo?.description || page.excerpt?.en,
      keywords: page.seo?.keywords,
      ogImage: page.seo?.ogImage || page.featuredImage,
    };
  }
);

/**
 * Check if page is accessible using React.cache
 */
export const isPageAccessible = cache(
  async (slug: string): Promise<boolean> => {
    try {
      const page = await getPageBySlug(slug);
      return page.status === "Published" && page.isPublic;
    } catch (error) {
      console.error(`Failed to check page accessibility for ${slug}:`, error);
      return false;
    }
  }
);

/**
 * Walks a layout-tree (containers > rows > columns > sectionRefs) and
 * returns every sectionId referenced. Layout-built pages don't carry a
 * top-level `sections` array — section ids live nested inside the
 * builder tree, so callers that need a flat list (the renderer's
 * `allSections` prop) have to gather them from here.
 */
function collectSectionIdsFromLayout(layout: any): string[] {
  if (!layout || !Array.isArray(layout.containers)) return [];
  const ids = new Set<string>();
  const visitRows = (rows: any[]) => {
    for (const row of rows ?? []) {
      for (const col of row?.columns ?? []) {
        for (const ref of col?.sectionRefs ?? []) {
          if (ref?.sectionId) ids.add(String(ref.sectionId));
        }
        // Sub-rows — depth-recurse so nested layouts work too.
        if (Array.isArray(col?.rows) && col.rows.length > 0) {
          visitRows(col.rows);
        }
      }
    }
  };
  for (const container of layout.containers) {
    visitRows(container?.rows ?? []);
  }
  return [...ids];
}

/**
 * Fetch every section referenced in a layout tree (containers > rows
 * > columns > sectionRefs[], including sub-rows). Used by the route
 * directly when it has already resolved the *effective* layout
 * (page.layout OR — for wrapper-mode pages — template.layout) and
 * `getPageSections(slug)` would walk only the page's own (empty)
 * layout.
 *
 * Returns `[]` for empty layouts, missing tenant context, or when
 * every fetch fails — never throws.
 */
export async function getSectionsByLayout(
  layout: any,
): Promise<SectionData[]> {
  const ids = collectSectionIdsFromLayout(layout);
  if (ids.length === 0) return [];

  const middleware = await getMiddlewareDataFromHeaders();
  const tenantId = middleware.tenantId;
  if (!tenantId) return [];

  const apiUrl = await getApiDomain();
  const sectionClient = createHttpClient({ baseURL: apiUrl });

  const fetched = await Promise.all(
    ids.map(async (id) => {
      try {
        // Anonymous section fetch — /sections/:id/public bypasses
        // CoreGuard. Tenant scoping is still enforced by the
        // OrganizationContextInterceptor on the backend.
        const resp: any = await sectionClient.request(
          `/content/sections/${id}/public`,
          { method: "GET", tenantId, withAuth: false },
        );
        const doc = resp?.data?._id
          ? resp.data
          : resp?._id
            ? resp
            : null;
        if (!doc) {
          console.warn(`getSectionsByLayout: empty response for section ${id}`);
          return null;
        }
        return doc as SectionData;
      } catch (err) {
        console.warn(
          `getSectionsByLayout: failed to fetch section ${id}`,
          err instanceof Error ? err.message : err,
        );
        return null;
      }
    }),
  );
  return fetched.filter((s): s is SectionData => !!s);
}

/**
 * Get page sections using React.cache.
 *
 * Two-tier resolution:
 *   1. Legacy: `page.sections` (flat array) — populated by the
 *      backend for pages authored under the old model.
 *   2. New: walk `page.layout` and fetch each referenced section by
 *      id — used by pages authored with the page-builder tree, which
 *      don't carry a top-level `sections` array.
 *
 * NOTE: this only walks `page.layout`. For wrapper-mode pages where
 * `page.layout` is empty and the layout lives on the assigned
 * template, the route must call `getSectionsByLayout(effectiveLayout)`
 * separately — this function intentionally doesn't fetch the
 * template (it lives in the publicWeb theme layer to avoid pulling
 * tenant/theme resolution into libs/page).
 */
export const getPageSections = cache(
  async (slug: string): Promise<SectionData[]> => {
    const page = await getPageBySlug(slug);

    // Tier 1 — legacy flat array.
    const flat = Array.isArray(page?.sections) ? page.sections : [];
    if (flat.length > 0) {
      return flat
        .filter((section) => section.isVisible)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    // Tier 2 — layout tree.
    return getSectionsByLayout((page as any)?.layout);
  },
);

/**
 * Validate page exists and is valid
 */
export const validatePage = cache(async (slug: string): Promise<boolean> => {
  try {
    const page = await getPageBySlug(slug);
    return !!(page && page._id && page.slug);
  } catch (error) {
    console.error(`Failed to validate page ${slug}:`, error);
    return false;
  }
});

/**
 * Clear page cache (useful for testing or manual refresh)
 */
export async function clearPageCache(
  tenantId?: string,
  slug?: string
): Promise<void> {
  const cache = getCacheInstance();

  if (tenantId && slug) {
    // Clear specific page cache
    const cacheKey = CacheKeys.pageBySlug(tenantId, slug);
    await cache.del(cacheKey);
    console.log(`Page cache cleared for tenant: ${tenantId}, slug: ${slug}`);
  } else if (tenantId) {
    // Clear all pages for tenant
    await cache.deletePattern(`ciApp:${tenantId}:Content:Page:*`);
    console.log(`All page cache cleared for tenant: ${tenantId}`);
  } else {
    // Clear all page cache across all tenants
    await cache.deletePattern("ciApp:*:Content:Page:*");
    console.log("All page cache cleared");
  }
}

/**
 * Utility function to get text in the correct language
 */
export function getLocalizedText(
  text: MultiLanguageText | string | undefined,
  language: string = "en"
): string {
  if (!text) return "";
  if (typeof text === "string") return text;

  // Return the requested language or fallback to English
  return text[language as keyof MultiLanguageText] || text.en || "";
}

/**
 * Utility function to generate page URL
 */
export function getPageUrl(slug: string, baseUrl: string = ""): string {
  return `${baseUrl}/${slug}`;
}

/**
 * Utility function to check if page is published
 */
export function isPagePublished(page: PageData): boolean {
  return (
    page.status === "Published" &&
    (!page.publishedAt || new Date(page.publishedAt) <= new Date())
  );
}
