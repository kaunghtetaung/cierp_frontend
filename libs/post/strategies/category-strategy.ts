// Category Strategy - Single Responsibility: Category data operations
import { CacheKeys, CacheTTL } from "@repo/cache";
import type { 
  CategoryStrategy, 
  PostCache, 
  PostHttpClient, 
  TenantContext 
} from '../types/post-types';
import { POST_CONSTANTS } from '../types/post-types';
import type { PostCategory } from '../types/types';
import type { ApiResponse } from "@repo/types";

export class StandardCategoryStrategy implements CategoryStrategy {
  constructor(
    private cache: PostCache,
    private httpClient: PostHttpClient,
    private tenantContext: TenantContext
  ) {}

  async getCategoryBySlug(slug: string): Promise<PostCategory | null> {
    const tenantId = await this.tenantContext.getTenantId();
    const cacheKey = CacheKeys.postCategory(tenantId, slug);

    // Try cache first
    const cached = await this.cache.get<PostCategory>(cacheKey);
    if (cached) return cached;

    try {
      // Anonymous read — see /categories/slug/:slug/public on the
      // backend (added alongside /categories/public for parity).
      const response: ApiResponse<PostCategory> = await this.httpClient.request(
        `/content/categories/slug/${slug}/public`,
        {
          method: "GET",
          tenantId,
          withAuth: false,
        }
      );

      if (!response.success || !response.data) {
        return null;
      }

      const category = response.data;
      await this.cache.set(cacheKey, category, CacheTTL.CONTENT || POST_CONSTANTS.CONTENT_CACHE_TTL);
      return category;
    } catch (error) {
      console.error(`📝 Category Strategy - Error fetching category:`, error);
      return null;
    }
  }

  async getCategories(): Promise<PostCategory[]> {
    const tenantId = await this.tenantContext.getTenantId();
    const cacheKey = CacheKeys.postCategories(tenantId);

    // Try cache first
    const cached = await this.cache.get<PostCategory[]>(cacheKey);
    if (cached) return cached;

    try {
      // Anonymous list — /categories/public pins status: 'Active'
      // server-side.
      const response: ApiResponse<PostCategory[]> = await this.httpClient.request(
        `/content/categories/public`,
        {
          method: "GET",
          tenantId,
          withAuth: false,
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch categories");
      }

      const categories = response.data;
      await this.cache.set(cacheKey, categories, CacheTTL.CONTENT || POST_CONSTANTS.CONTENT_CACHE_TTL);
      return [...categories];
    } catch (error) {
      console.error(`📝 Category Strategy - Error fetching categories:`, error);
      throw error;
    }
  }
}