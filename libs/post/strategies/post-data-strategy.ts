// Post Data Strategy - Single Responsibility: Core post data operations
import { CacheKeys, CacheTTL } from "@repo/cache";
import type { 
  PostDataStrategy, 
  PostCache, 
  PostHttpClient, 
  TenantContext 
} from '../types/post-types';
import { POST_CONSTANTS } from '../types/post-types';
import type { 
  BasePostData, 
  PopulatedPostData, 
  PostListResult, 
  PostListOptions 
} from '../types/types';
import type { ApiResponse } from "@repo/types";

export class StandardPostDataStrategy implements PostDataStrategy {
  constructor(
    private cache: PostCache,
    private httpClient: PostHttpClient,
    private tenantContext: TenantContext
  ) {}

  async getPostBySlug(slug: string, populate: boolean = true): Promise<BasePostData | PopulatedPostData> {
    const tenantId = await this.tenantContext.getTenantId();
    const cacheKey = CacheKeys.postBySlug(tenantId, `${slug}:${populate ? 'populated' : 'basic'}`);

    // Try to get from cache first
    const cachedPost = await this.cache.get<BasePostData | PopulatedPostData>(cacheKey);
    if (cachedPost && this.isValidPostData(cachedPost)) {
      return cachedPost;
    }

    // Fetch from API with retry logic
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= POST_CONSTANTS.MAX_RETRIES; attempt++) {
      try {
        console.log(
          `📝 Post Data Strategy - Making API request (attempt ${attempt}/${POST_CONSTANTS.MAX_RETRIES}) to: /content/post/slug/${slug} for tenant: ${tenantId}`
        );

        const endpoint = populate 
          ? `/content/post/slug/${slug}?populate=true`
          : `/content/post/slug/${slug}`;

        const response: ApiResponse<BasePostData | PopulatedPostData> = await this.httpClient.request(
          endpoint,
          {
            method: "GET",
            tenantId,
            withAuth: true,
          }
        );

        console.log(`📝 Post Data Strategy - API response received:`, {
          success: response.success,
          hasData: !!response.data,
          error: response.error,
          attempt,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || "Failed to fetch post");
        }

        const postData = response.data;

        // Validate and cache the result
        if (this.isValidPostData(postData)) {
          await this.cache.set(
            cacheKey,
            postData,
            CacheTTL.CONTENT || POST_CONSTANTS.CONTENT_CACHE_TTL
          );
          console.log(
            `📝 Post Data Strategy - Post cached successfully for: ${slug}`
          );
        } else {
          console.warn(
            `📝 Post Data Strategy - Invalid post data received for: ${slug}`
          );
        }

        return postData;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.error(
          `📝 Post Data Strategy - Error on attempt ${attempt}:`,
          lastError.message
        );

        // If it's a token error and we have retries left, continue to retry
        if (
          lastError.message.includes("Token has expired") &&
          attempt < POST_CONSTANTS.MAX_RETRIES
        ) {
          console.log(
            `📝 Post Data Strategy - Token expired, retrying... (attempt ${
              attempt + 1
            }/${POST_CONSTANTS.MAX_RETRIES})`
          );
          // Small delay before retry to allow token refresh
          await new Promise((resolve) => setTimeout(resolve, POST_CONSTANTS.RETRY_DELAY_MS));
          continue;
        }

        // If it's not a token error or we're out of retries, break
        break;
      }
    }

    // If we get here, all retries failed
    console.error(
      `📝 Post Data Strategy - All attempts failed for post "${slug}":`,
      lastError?.message
    );
    throw new Error(
      `Failed to fetch post "${slug}": ${lastError?.message || "Unknown error"}`
    );
  }

  async getPostsList(options: PostListOptions = {}): Promise<PostListResult> {
    const tenantId = await this.tenantContext.getTenantId();

    // Build cache key from options
    const optionsKey = JSON.stringify(options);
    const cacheKey = CacheKeys.postList(tenantId) + `:${Buffer.from(optionsKey).toString('base64').slice(0, 16)}`;

    // Try to get from cache first
    const cachedResult = await this.cache.get<PostListResult>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      console.log(
        `📝 Post Data Strategy - Fetching posts list for tenant: ${tenantId}`, options
      );

      // Build query parameters
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.status) params.append('status', options.status);
      if (options.visibility) params.append('visibility', options.visibility);
      if (options.categoryIds?.length) params.append('categoryIds', options.categoryIds.join(','));
      if (options.tagIds?.length) params.append('tagIds', options.tagIds.join(','));
      if (options.search) params.append('search', options.search);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      if (options.featured !== undefined) params.append('featured', options.featured.toString());
      if (options.pinned !== undefined) params.append('pinned', options.pinned.toString());

      const endpoint = `/content/posts?${params.toString()}`;

      const response: ApiResponse<PostListResult> = await this.httpClient.request(
        endpoint,
        {
          method: "GET",
          tenantId,
          withAuth: true,
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch posts");
      }

      const result = response.data;

      // Cache the result
      await this.cache.set(
        cacheKey,
        result,
        CacheTTL.CONTENT || POST_CONSTANTS.LIST_CACHE_TTL
      );

      return result;
    } catch (error) {
      console.error(`📝 Post Data Strategy - Error fetching posts list:`, error);
      throw error;
    }
  }

  async incrementPostViews(slug: string): Promise<void> {
    try {
      const tenantId = await this.tenantContext.getTenantId();

      await this.httpClient.request(
        `/content/post/slug/${slug}/views`,
        {
          method: "POST",
          tenantId,
          withAuth: false, // Views can be incremented without auth
        }
      );

      // Invalidate post cache to get updated view count
      await this.cache.deletePattern(`ciApp:${tenantId}:Content:Post:${slug}:*`);
    } catch (error) {
      console.error(`📝 Post Data Strategy - Error incrementing views for ${slug}:`, error);
      // Don't throw error for view tracking failures
    }
  }

  async isPostAccessible(slug: string): Promise<boolean> {
    try {
      const post = await this.getPostBySlug(slug, false);
      return post.status === "Published" && 
             post.visibility === "Public" &&
             (!post.publishedAt || new Date(post.publishedAt) <= new Date());
    } catch (error) {
      return false;
    }
  }

  private isValidPostData(data: any): data is BasePostData | PopulatedPostData {
    return (
      data &&
      typeof data === "object" &&
      data._id &&
      data.slug &&
      data.title &&
      typeof data.title === "object" &&
      data.title.en &&
      data.content &&
      typeof data.content === "object" &&
      data.content.en &&
      data.status &&
      data.visibility &&
      data.tenantId
    );
  }
}