// Tag Strategy - Single Responsibility: Tag data operations
import { CacheKeys, CacheTTL } from "@repo/cache";
import type { 
  TagStrategy, 
  PostCache, 
  PostHttpClient, 
  TenantContext 
} from '../types/post-types';
import { POST_CONSTANTS } from '../types/post-types';
import type { PostTag } from '../types/types';
import type { ApiResponse } from "@repo/types";

export class StandardTagStrategy implements TagStrategy {
  constructor(
    private cache: PostCache,
    private httpClient: PostHttpClient,
    private tenantContext: TenantContext
  ) {}

  async getTagBySlug(slug: string): Promise<PostTag | null> {
    const tenantId = await this.tenantContext.getTenantId();
    const cacheKey = CacheKeys.postTag(tenantId, slug);

    // Try cache first
    const cached = await this.cache.get<PostTag>(cacheKey);
    if (cached) return cached;

    try {
      const response: ApiResponse<PostTag> = await this.httpClient.request(
        `/content/tags/slug/${slug}`,
        {
          method: "GET",
          tenantId,
          withAuth: true,
        }
      );

      if (!response.success || !response.data) {
        return null;
      }

      const tag = response.data;
      await this.cache.set(cacheKey, tag, CacheTTL.CONTENT || POST_CONSTANTS.CONTENT_CACHE_TTL);
      return tag;
    } catch (error) {
      console.error(`📝 Tag Strategy - Error fetching tag:`, error);
      return null;
    }
  }

  async getTags(): Promise<PostTag[]> {
    const tenantId = await this.tenantContext.getTenantId();
    const cacheKey = CacheKeys.postTags(tenantId);

    // Try cache first
    const cached = await this.cache.get<PostTag[]>(cacheKey);
    if (cached) return cached;

    try {
      const response: ApiResponse<PostTag[]> = await this.httpClient.request(
        `/content/tags`,
        {
          method: "GET",
          tenantId,
          withAuth: true,
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch tags");
      }

      const tags = response.data;
      await this.cache.set(cacheKey, tags, CacheTTL.CONTENT || POST_CONSTANTS.CONTENT_CACHE_TTL);
      return [...tags];
    } catch (error) {
      console.error(`📝 Tag Strategy - Error fetching tags:`, error);
      throw error;
    }
  }
}