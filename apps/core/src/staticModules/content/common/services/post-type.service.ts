/**
 * Post Type Service
 * Handles all API calls to the post type module
 * Following ModuleService pattern with httpClient.request()
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type { ApiResponse } from '@repo/types';
import type {
  PostType,
  CreatePostTypeDto,
  UpdatePostTypeDto,
  PostTypeQuery,
  AddAttributeDto,
  UpdateAttributeDto,
  RemoveAttributeDto,
  ReorderAttributesDto,
  PostTypeListResponse,
  PostTypeDetailResponse,
} from '../types';

// Base endpoint for post type API
// Backend URL structure: http://api-dev.tenant.com/content/post-types
// Following API gateway pattern: /{serviceName}/{module}
// serviceName = content, module = post-types
const POST_TYPE_BASE = '/content/post-types';

/**
 * Post Type Service Class
 * Follows ModuleService pattern with proper request config
 */
export class PostTypeService {
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
   * Create a new post type
   */
  async create(data: CreatePostTypeDto): Promise<ApiResponse<PostType>> {
    const response = await this.httpClient.request<PostType>(
      POST_TYPE_BASE,
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
      throw new Error(response.error || 'Failed to create post type');
    }

    return response;
  }

  /**
   * Get paginated list of post types with optional filters
   */
  async getAll(params?: PostTypeQuery): Promise<ApiResponse<PostTypeListResponse>> {
    let endpoint = POST_TYPE_BASE;
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.search) queryParams.set('search', params.search);
      if (params.status) queryParams.set('status', params.status);
      if (params.departmentId) queryParams.set('departmentId', params.departmentId);
      if (params.includePostCount !== undefined) queryParams.set('includePostCount', String(params.includePostCount));
      if (params.includeDeleted !== undefined) queryParams.set('includeDeleted', String(params.includeDeleted));
      if (params.isSystem !== undefined) queryParams.set('isSystem', String(params.isSystem));
      if (params.language) queryParams.set('language', params.language);
      if (params.skip !== undefined) queryParams.set('skip', String(params.skip));
      if (params.limit !== undefined) queryParams.set('limit', String(params.limit));
      if (params.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    const response = await this.httpClient.request<PostTypeListResponse>(
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
      throw new Error(response.error || 'Failed to fetch post types');
    }

    return response;
  }

  /**
   * Get a single post type by ID
   */
  async getById(id: string): Promise<ApiResponse<PostType>> {
    const response = await this.httpClient.request<PostType>(
      `${POST_TYPE_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to fetch post type');
    }

    return response;
  }

  /**
   * Get a post type by slug
   */
  async getBySlug(slug: string): Promise<ApiResponse<PostType>> {
    const response = await this.httpClient.request<PostType>(
      `${POST_TYPE_BASE}/slug/${slug}`,
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
      throw new Error(response.error || 'Failed to fetch post type by slug');
    }

    return response;
  }

  /**
   * Update a post type
   */
  async update(id: string, data: UpdatePostTypeDto): Promise<ApiResponse<PostType>> {
    const response = await this.httpClient.request<PostType>(
      `${POST_TYPE_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to update post type');
    }

    return response;
  }

  /**
   * Delete a post type (soft delete)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${POST_TYPE_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to delete post type');
    }

    return response;
  }

  /**
   * Add an attribute to a post type
   */
  async addAttribute(id: string, data: AddAttributeDto): Promise<ApiResponse<PostType>> {
    const response = await this.httpClient.request<PostType>(
      `${POST_TYPE_BASE}/${id}/attributes`,
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
      throw new Error(response.error || 'Failed to add attribute');
    }

    return response;
  }

  /**
   * Update an attribute of a post type
   */
  async updateAttribute(id: string, data: UpdateAttributeDto): Promise<ApiResponse<PostType>> {
    const response = await this.httpClient.request<PostType>(
      `${POST_TYPE_BASE}/${id}/attributes/${data.attributeKey}`,
      {
        method: 'PATCH',
        body: data.attribute,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to update attribute');
    }

    return response;
  }

  /**
   * Remove an attribute from a post type
   */
  async removeAttribute(id: string, data: RemoveAttributeDto): Promise<ApiResponse<PostType>> {
    const response = await this.httpClient.request<PostType>(
      `${POST_TYPE_BASE}/${id}/attributes/${data.attributeKey}`,
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
      throw new Error(response.error || 'Failed to remove attribute');
    }

    return response;
  }

  /**
   * Reorder attributes of a post type
   */
  async reorderAttributes(id: string, data: ReorderAttributesDto): Promise<ApiResponse<PostType>> {
    const response = await this.httpClient.request<PostType>(
      `${POST_TYPE_BASE}/${id}/attributes/reorder`,
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
      throw new Error(response.error || 'Failed to reorder attributes');
    }

    return response;
  }

  /**
   * Restore a soft-deleted post type
   */
  async restore(id: string): Promise<ApiResponse<PostType>> {
    const response = await this.httpClient.request<PostType>(
      `${POST_TYPE_BASE}/${id}/restore`,
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
      throw new Error(response.error || 'Failed to restore post type');
    }

    return response;
  }
}
