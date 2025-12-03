/**
 * Post Service
 * Handles all API calls to the post module
 * Following ModuleService pattern with httpClient.request()
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type { ApiResponse } from '@repo/types';
import type {
  Post,
  PostRevision,
  CreatePostDto,
  UpdatePostDto,
  PostQuery,
  PostSearchQuery,
  PostSearchResult,
  RelatedPostsQuery,
  PostStatistics,
  BulkPostOperation,
  PostListResponse,
  PostDetailResponse,
  PostRevisionListResponse,
  PostSearchResponse,
  PostStatisticsResponse,
} from '../types';

// Base endpoint for post API
// Backend URL structure: http://api-dev.tenant.com/content/post
// Following API gateway pattern: /{serviceName}/{module}
// serviceName = content, module = post
const POST_BASE = '/content/post';

/**
 * Post Service Class
 * Follows ModuleService pattern with proper request config
 */
export class PostService {
  private httpClient;
  private baseURL: string;
  private tenantId?: string;
  private userSessionId?: string;
  private userId?: string;

  constructor(
    baseURL: string,
    options?: {
      tenantId?: string;
      userSessionId?: string;
      userId?: string;
    }
  ) {
    this.baseURL = baseURL;
    this.httpClient = getCachedServerHttpClient(baseURL);
    this.tenantId = options?.tenantId;
    this.userSessionId = options?.userSessionId;
    this.userId = options?.userId;
  }

  /**
   * Create a new post
   */
  async create(data: CreatePostDto): Promise<ApiResponse<Post>> {
    const response = await this.httpClient.request<Post>(
      POST_BASE,
      {
        method: 'POST',
        body: data,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to create post');
    }

    return response;
  }

  /**
   * Get paginated list of posts with optional filters
   */
  async getAll(params?: PostQuery): Promise<ApiResponse<PostListResponse>> {
    let endpoint = POST_BASE;
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.search) queryParams.set('search', params.search);
      if (params.postTypeId) queryParams.set('postTypeId', params.postTypeId);
      if (params.postTypeSlug) queryParams.set('postTypeSlug', params.postTypeSlug);
      if (params.categoryId) queryParams.set('categoryId', params.categoryId);
      if (params.categorySlug) queryParams.set('categorySlug', params.categorySlug);
      if (params.tagId) queryParams.set('tagId', params.tagId);
      if (params.tagSlug) queryParams.set('tagSlug', params.tagSlug);
      if (params.authorId) queryParams.set('authorId', params.authorId);
      if (params.status) queryParams.set('status', params.status);
      if (params.visibility) queryParams.set('visibility', params.visibility);
      if (params.isFeatured !== undefined) queryParams.set('isFeatured', String(params.isFeatured));
      if (params.isPinned !== undefined) queryParams.set('isPinned', String(params.isPinned));
      if (params.departmentId) queryParams.set('departmentId', params.departmentId);
      if (params.publishedAfter) queryParams.set('publishedAfter', params.publishedAfter);
      if (params.publishedBefore) queryParams.set('publishedBefore', params.publishedBefore);
      if (params.includeDeleted !== undefined) queryParams.set('includeDeleted', String(params.includeDeleted));
      if (params.includeDrafts !== undefined) queryParams.set('includeDrafts', String(params.includeDrafts));
      if (params.language) queryParams.set('language', params.language);
      if (params.skip !== undefined) queryParams.set('skip', String(params.skip));
      if (params.limit !== undefined) queryParams.set('limit', String(params.limit));
      if (params.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    const response = await this.httpClient.request<PostListResponse>(
      endpoint,
      {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
        timeout: 25000,
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch posts');
    }

    return response;
  }

  /**
   * Get a single post by ID
   */
  async getById(id: string): Promise<ApiResponse<Post>> {
    const response = await this.httpClient.request<Post>(
      `${POST_BASE}/${id}`,
      {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch post');
    }

    return response;
  }

  /**
   * Get a post by slug
   */
  async getBySlug(slug: string): Promise<ApiResponse<Post>> {
    const response = await this.httpClient.request<Post>(
      `${POST_BASE}/slug/${slug}`,
      {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch post by slug');
    }

    return response;
  }

  /**
   * Update a post
   */
  async update(id: string, data: UpdatePostDto): Promise<ApiResponse<Post>> {
    const response = await this.httpClient.request<Post>(
      `${POST_BASE}/${id}`,
      {
        method: 'PATCH',
        body: data,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to update post');
    }

    return response;
  }

  /**
   * Delete a post (soft delete)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${POST_BASE}/${id}`,
      {
        method: 'DELETE',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete post');
    }

    return response;
  }

  /**
   * Publish a post
   */
  async publish(id: string): Promise<ApiResponse<Post>> {
    const response = await this.httpClient.request<Post>(
      `${POST_BASE}/${id}/publish`,
      {
        method: 'POST',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to publish post');
    }

    return response;
  }

  /**
   * Unpublish a post
   */
  async unpublish(id: string): Promise<ApiResponse<Post>> {
    const response = await this.httpClient.request<Post>(
      `${POST_BASE}/${id}/unpublish`,
      {
        method: 'POST',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to unpublish post');
    }

    return response;
  }

  /**
   * Schedule a post for future publication
   */
  async schedule(id: string, scheduledAt: string): Promise<ApiResponse<Post>> {
    const response = await this.httpClient.request<Post>(
      `${POST_BASE}/${id}/schedule`,
      {
        method: 'POST',
        body: { scheduledAt },
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to schedule post');
    }

    return response;
  }

  /**
   * Archive a post
   */
  async archive(id: string): Promise<ApiResponse<Post>> {
    const response = await this.httpClient.request<Post>(
      `${POST_BASE}/${id}/archive`,
      {
        method: 'POST',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to archive post');
    }

    return response;
  }

  /**
   * Search posts with full-text search
   */
  async search(params: PostSearchQuery): Promise<ApiResponse<PostSearchResponse>> {
    const queryParams = new URLSearchParams();
    queryParams.set('query', params.query);
    if (params.postTypeId) queryParams.set('postTypeId', params.postTypeId);
    if (params.categoryId) queryParams.set('categoryId', params.categoryId);
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.highlight !== undefined) queryParams.set('highlight', String(params.highlight));

    const response = await this.httpClient.request<PostSearchResponse>(
      `${POST_BASE}/search?${queryParams.toString()}`,
      {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to search posts');
    }

    return response;
  }

  /**
   * Get related posts
   */
  async getRelated(params: RelatedPostsQuery): Promise<ApiResponse<Post[]>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.strategy) queryParams.set('strategy', params.strategy);

    const response = await this.httpClient.request<Post[]>(
      `${POST_BASE}/${params.postId}/related?${queryParams.toString()}`,
      {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch related posts');
    }

    return response;
  }

  /**
   * Get post statistics
   */
  async getStatistics(departmentId?: string): Promise<ApiResponse<PostStatistics>> {
    let endpoint = `${POST_BASE}/statistics`;
    if (departmentId) {
      endpoint += `?departmentId=${departmentId}`;
    }

    const response = await this.httpClient.request<PostStatistics>(
      endpoint,
      {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch post statistics');
    }

    return response;
  }

  /**
   * Get post revisions
   */
  async getRevisions(postId: string): Promise<ApiResponse<PostRevision[]>> {
    const response = await this.httpClient.request<PostRevision[]>(
      `${POST_BASE}/${postId}/revisions`,
      {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch post revisions');
    }

    return response;
  }

  /**
   * Restore a post to a specific revision
   */
  async restoreRevision(postId: string, revisionId: string): Promise<ApiResponse<Post>> {
    const response = await this.httpClient.request<Post>(
      `${POST_BASE}/${postId}/revisions/${revisionId}/restore`,
      {
        method: 'POST',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to restore post revision');
    }

    return response;
  }

  /**
   * Bulk operation on posts
   */
  async bulkOperation(data: BulkPostOperation): Promise<ApiResponse<{ affected: number }>> {
    const response = await this.httpClient.request<{ affected: number }>(
      `${POST_BASE}/bulk/${data.operation}`,
      {
        method: 'POST',
        body: { ids: data.ids },
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to perform bulk operation');
    }

    return response;
  }

  /**
   * Restore a soft-deleted post
   */
  async restore(id: string): Promise<ApiResponse<Post>> {
    const response = await this.httpClient.request<Post>(
      `${POST_BASE}/${id}/restore`,
      {
        method: 'POST',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to restore post');
    }

    return response;
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${POST_BASE}/${id}/view`,
      {
        method: 'POST',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: false,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to increment view count');
    }

    return response;
  }
}
