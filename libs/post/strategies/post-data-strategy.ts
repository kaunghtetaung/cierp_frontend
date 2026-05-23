// Post Data Strategy - Single Responsibility: Core post data operations
import { CacheKeys, CacheTTL } from "@repo/cache";
import { resolveAuthMode } from "@repo/auth/session-fetch";
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
    const auth = await resolveAuthMode();
    const cacheKey = CacheKeys.postBySlug(tenantId, `${slug}:${populate ? 'populated' : 'basic'}`);

    // Cache only the anonymous path — authenticated reads are
    // role/group/user-scoped (Private/Protected/Password) and caching them
    // under a tenant-scoped key would leak content across sessions.
    const allowCache = !auth.authenticated;

    if (allowCache) {
      const cachedPost = await this.cache.get<BasePostData | PopulatedPostData>(cacheKey);
      if (cachedPost && this.isValidPostData(cachedPost)) {
        return cachedPost;
      }
    }

    // Fetch from API with retry logic
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= POST_CONSTANTS.MAX_RETRIES; attempt++) {
      try {
        console.log(
          `📝 Post Data Strategy - Making API request (attempt ${attempt}/${POST_CONSTANTS.MAX_RETRIES}) to: /content/post/slug/${slug} for tenant: ${tenantId} (auth=${auth.authenticated})`
        );

        // Backend `findBySlug` already populates organization, dept,
        // postType, categoryIds, tagIds, createdBy, publishedBy by
        // default — so `?populate=true` was always redundant AND it
        // now gets rejected by the gateway's query-field validation
        // (`INVALID_QUERY_FIELD` 400). Always hit the bare endpoint.
        // The `populate` argument is kept on this method for backward
        // compatibility with existing callers but is now ignored.
        void populate;
        // Endpoint switches on session presence:
        //   - anonymous → `/public` sibling forces visibility: 'Public'
        //   - authenticated → bare route; VisibilityInterceptor on the
        //     backend filters Private/Protected/Password rows against the
        //     visitor's role/group/membership.
        const endpoint = auth.authenticated
          ? `/content/post/slug/${encodeURIComponent(slug)}`
          : `/content/post/slug/${encodeURIComponent(slug)}/public`;

        const response: any = await this.httpClient.request(
          endpoint,
          {
            method: "GET",
            tenantId,
            withAuth: auth.withAuth,
            ...(auth.authenticated ? { tokenStrategy: auth.tokenStrategy } : {}),
          }
        );

        // Raw response logging so we can see exactly what the
        // gateway returns when the slug isn't resolving. Shape may
        // be `{success, data, error}` (ApiResponse envelope) OR the
        // post doc itself depending on how StandardResponseHandler
        // unwraps.
        console.log(
          `📝 Post Data Strategy - raw response for slug='${slug}':`,
          {
            attempt,
            success: response?.success,
            error: response?.error,
            message: response?.message,
            hasDataKey: response && typeof response === "object" && "data" in response,
            dataIsObject: typeof response?.data === "object" && response?.data !== null,
            dataHasId: !!(response?.data as any)?._id,
            responseHasId: !!(response as any)?._id,
          },
        );

        // The post controller returns the doc unwrapped (no
        // `{success, data, error}` envelope) — sometimes the response
        // handler wraps it in `{ data: <post> }`, sometimes it passes
        // through directly. Accept both shapes by reading whichever
        // has a real `_id`. Without this, `response.success` is
        // undefined for the unwrapped shape and the request throws
        // "Failed to fetch post" even when the doc exists.
        const postData = (response &&
          response.data &&
          (response.data as any)._id)
          ? response.data
          : response && (response as any)._id
            ? response
            : null;

        if (!postData) {
          throw new Error(
            (response && (response as any).error) || "Failed to fetch post",
          );
        }

        // Validate and (when anonymous) cache the result. Authenticated
        // reads skip the cache so per-user visibility filtering can't
        // bleed across sessions.
        if (this.isValidPostData(postData)) {
          if (allowCache) {
            await this.cache.set(
              cacheKey,
              postData,
              CacheTTL.CONTENT || POST_CONSTANTS.CONTENT_CACHE_TTL
            );
            console.log(
              `📝 Post Data Strategy - Post cached successfully for: ${slug}`
            );
          }
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
    const auth = await resolveAuthMode();

    // Build cache key from options
    const optionsKey = JSON.stringify(options);
    const cacheKey = CacheKeys.postList(tenantId) + `:${Buffer.from(optionsKey).toString('base64').slice(0, 16)}`;

    // Authenticated lists are visibility-filtered per-user — never serve
    // them from a tenant-scoped cache.
    const allowCache = !auth.authenticated;

    if (allowCache) {
      const cachedResult = await this.cache.get<PostListResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    try {
      console.log(
        `📝 Post Data Strategy - Fetching posts list for tenant: ${tenantId} (auth=${auth.authenticated})`, options
      );

      // Build query parameters.
      //
      // Anonymous → /content/post/public:
      //   - status + visibility are dropped: the public endpoint forces
      //     status: 'Published' and visibility: 'Public' server-side.
      //   - categoryIds/tagIds (plural) become categoryId/tagId
      //     (singular) — PostPublicQueryDto only supports one of each.
      //   - featured/pinned are not in PostPublicQueryDto and would be
      //     rejected.
      //
      // Authenticated → /content/post:
      //   - VisibilityInterceptor handles Private/Protected/Password
      //     filtering against the visitor's role/group/membership.
      //   - We still scope to status=Published so signed-in visitors see
      //     the same set of *published* rows the public endpoint would,
      //     just with the extra non-Public ones their role grants.
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.categoryIds?.length) params.append('categoryId', options.categoryIds[0]);
      if (options.tagIds?.length) params.append('tagId', options.tagIds[0]);
      if (options.search) params.append('search', options.search);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      if (auth.authenticated) {
        // publicView=true asks the backend to pin base status to
        // Published AND OR-include any drafts the viewer's roles
        // grant (sys / org / dept admin per the post's dept). Without
        // this flag, /content/post defaults to "all statuses" which
        // would leak unrelated drafts to ordinary signed-in viewers.
        params.append('publicView', 'true');
      }

      const endpoint = auth.authenticated
        ? `/content/post?${params.toString()}`
        : `/content/post/public?${params.toString()}`;

      const response: ApiResponse<PostListResult> = await this.httpClient.request(
        endpoint,
        {
          method: "GET",
          tenantId,
          withAuth: auth.withAuth,
          ...(auth.authenticated ? { tokenStrategy: auth.tokenStrategy } : {}),
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch posts");
      }

      const result = response.data;

      // Cache only the anonymous response — see allowCache note above.
      if (allowCache) {
        await this.cache.set(
          cacheKey,
          result,
          CacheTTL.CONTENT || POST_CONSTANTS.LIST_CACHE_TTL
        );
      }

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