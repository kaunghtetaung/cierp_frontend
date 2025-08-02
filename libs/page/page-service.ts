// Page service for reading pages by slug - Read-only API
import { cache } from "react";
import { headers } from "next/headers";
import { getApiDomain } from "@repo/utils/server";
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
   * Get page by slug for current tenant (read-only)
   * This is the main method for fetching pages by slug
   */
  async getPageBySlug(slug: string): Promise<PageData> {
    // Get tenant ID from headers
    const middlewareData = await getMiddlewareDataFromHeaders();
    const tenantId = middlewareData.tenantId;

    if (!tenantId) {
      throw new Error("No tenant ID found in request headers");
    }

    const cacheKey = CacheKeys.pageBySlug(tenantId, slug);

    // Try to get from cache first
    const cachedPage = await this.cache.get<PageData>(cacheKey);
    if (cachedPage && this.isValidPageData(cachedPage)) {
      return cachedPage;
    }

    // Fetch from API using HTTP client with tenant context - with token retry
    let lastError: Error | null = null;
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `📄 Page Service - Making API request (attempt ${attempt}/${maxRetries}) to: /content/page/slug/${slug} for tenant: ${tenantId}`
        );

        const response: ApiResponse<PageData> = await this.httpClient.request(
          `/content/page/slug/${slug}`,
          {
            method: "GET",
            tenantId,
            withAuth: true,
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

        // Validate and cache the result
        if (this.isValidPageData(pageData)) {
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
   * Get page sections that are enabled
   */
  async getPageSections(slug: string): Promise<SectionData[]> {
    const page = await this.getPageBySlug(slug);
    return page.sections
      .filter((section) => section.isVisible)
      .sort((a, b) => a.order - b.order);
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
 * Get page sections using React.cache
 */
export const getPageSections = cache(
  async (slug: string): Promise<SectionData[]> => {
    const page = await getPageBySlug(slug);
    return page.sections
      .filter((section) => section.isVisible)
      .sort((a, b) => a.order - b.order);
  }
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
