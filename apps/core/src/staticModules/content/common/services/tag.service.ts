/**
 * Tag Service
 * Handles all API calls to the tag module
 * Following ModuleService pattern with httpClient.request()
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type { ApiResponse } from '@repo/types';
import type {
  Tag,
  CreateTagDto,
  UpdateTagDto,
  TagQuery,
  TagAutocompleteQuery,
  TagSuggestion,
  MergeTagsDto,
  TagListResponse,
  TagDetailResponse,
} from '../types';

// Base endpoint for tag API
// Backend URL structure: http://api-dev.tenant.com/content/tags
// Following API gateway pattern: /{serviceName}/{module}
// serviceName = content, module = tags
const TAG_BASE = '/content/tags';

/**
 * Tag Service Class
 * Follows ModuleService pattern with proper request config
 */
export class TagService {
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
   * Create a new tag
   */
  async create(data: CreateTagDto): Promise<ApiResponse<Tag>> {
    const response = await this.httpClient.request<Tag>(
      TAG_BASE,
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
      throw new Error(response.error || 'Failed to create tag');
    }

    return response;
  }

  /**
   * Lightweight `/ref` lookup for dropdown pickers — same shape as the
   * canonical reference endpoints used elsewhere in the codebase.
   */
  async getReference(params?: { search?: string; limit?: number; status?: string }): Promise<
    ApiResponse<{
      statusCode: number;
      message: string;
      data: Array<{ id: string; label: string; value: string }>;
      total: number;
    }>
  > {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    if (params?.status) qs.set('status', params.status);
    const endpoint = `${TAG_BASE}/ref${qs.toString() ? `?${qs}` : ''}`;
    const response = await this.httpClient.request<{
      statusCode: number;
      message: string;
      data: Array<{ id: string; label: string; value: string }>;
      total: number;
    }>(endpoint, {
      method: 'GET',
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
      tokenStrategy: 'auto',
      timeout: 25000,
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch tag reference');
    }
    return response;
  }

  /**
   * Get paginated list of tags with optional filters
   */
  async getAll(params?: TagQuery): Promise<ApiResponse<TagListResponse>> {
    let endpoint = TAG_BASE;
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.search) queryParams.set('search', params.search);
      if (params.status) queryParams.set('status', params.status);
      if (params.departmentId) queryParams.set('departmentId', params.departmentId);
      if (params.includePostCount !== undefined) queryParams.set('includePostCount', String(params.includePostCount));
      if (params.includeDeleted !== undefined) queryParams.set('includeDeleted', String(params.includeDeleted));
      if (params.language) queryParams.set('language', params.language);
      if (params.skip !== undefined) queryParams.set('skip', String(params.skip));
      if (params.limit !== undefined) queryParams.set('limit', String(params.limit));
      if (params.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    const response = await this.httpClient.request<TagListResponse>(
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
      throw new Error(response.error || 'Failed to fetch tags');
    }

    return response;
  }

  /**
   * Get a single tag by ID
   */
  async getById(id: string): Promise<ApiResponse<Tag>> {
    const response = await this.httpClient.request<Tag>(
      `${TAG_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to fetch tag');
    }

    return response;
  }

  /**
   * Get a tag by slug
   */
  async getBySlug(slug: string): Promise<ApiResponse<Tag>> {
    const response = await this.httpClient.request<Tag>(
      `${TAG_BASE}/slug/${slug}`,
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
      throw new Error(response.error || 'Failed to fetch tag by slug');
    }

    return response;
  }

  /**
   * Update a tag
   */
  async update(id: string, data: UpdateTagDto): Promise<ApiResponse<Tag>> {
    const response = await this.httpClient.request<Tag>(
      `${TAG_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to update tag');
    }

    return response;
  }

  /**
   * Delete a tag (soft delete)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${TAG_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to delete tag');
    }

    return response;
  }

  /**
   * Autocomplete search for tags
   */
  async autocomplete(params: TagAutocompleteQuery): Promise<ApiResponse<TagSuggestion[]>> {
    const queryParams = new URLSearchParams();
    queryParams.set('search', params.search);
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.departmentId) queryParams.set('departmentId', params.departmentId);

    const response = await this.httpClient.request<TagSuggestion[]>(
      `${TAG_BASE}/autocomplete?${queryParams.toString()}`,
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
      throw new Error(response.error || 'Failed to fetch tag suggestions');
    }

    return response;
  }

  /**
   * Get popular tags
   */
  async getPopular(limit: number = 10, departmentId?: string): Promise<ApiResponse<Tag[]>> {
    const queryParams = new URLSearchParams();
    queryParams.set('limit', String(limit));
    if (departmentId) queryParams.set('departmentId', departmentId);

    const response = await this.httpClient.request<Tag[]>(
      `${TAG_BASE}/popular?${queryParams.toString()}`,
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
      throw new Error(response.error || 'Failed to fetch popular tags');
    }

    return response;
  }

  /**
   * Merge multiple tags into one
   */
  async merge(data: MergeTagsDto): Promise<ApiResponse<Tag>> {
    const response = await this.httpClient.request<Tag>(
      `${TAG_BASE}/merge`,
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
      throw new Error(response.error || 'Failed to merge tags');
    }

    return response;
  }

  /**
   * Restore a soft-deleted tag
   */
  async restore(id: string): Promise<ApiResponse<Tag>> {
    const response = await this.httpClient.request<Tag>(
      `${TAG_BASE}/${id}/restore`,
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
      throw new Error(response.error || 'Failed to restore tag');
    }

    return response;
  }
}
