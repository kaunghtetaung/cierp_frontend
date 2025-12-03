/**
 * Category Service
 * Handles all API calls to the category module
 * Following ModuleService pattern with httpClient.request()
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type { ApiResponse } from '@repo/types';
import type {
  Category,
  CategoryTreeNode,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQuery,
  MoveCategoryDto,
  ReorderCategoriesDto,
  CategoryListResponse,
  CategoryTreeResponse,
  CategoryDetailResponse,
} from '../types';

// Base endpoint for category API
// Backend URL structure: http://api-dev.tenant.com/content/categories
// Following API gateway pattern: /{serviceName}/{module}
// serviceName = content, module = categories
const CATEGORY_BASE = '/content/categories';

/**
 * Category Service Class
 * Follows ModuleService pattern with proper request config
 */
export class CategoryService {
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
   * Create a new category
   */
  async create(data: CreateCategoryDto): Promise<ApiResponse<Category>> {
    const response = await this.httpClient.request<Category>(
      CATEGORY_BASE,
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
      throw new Error(response.error || 'Failed to create category');
    }

    return response;
  }

  /**
   * Get paginated list of categories with optional filters
   */
  async getAll(params?: CategoryQuery): Promise<ApiResponse<CategoryListResponse>> {
    let endpoint = CATEGORY_BASE;
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.search) queryParams.set('search', params.search);
      if (params.parentId) queryParams.set('parentId', params.parentId);
      if (params.level !== undefined) queryParams.set('level', String(params.level));
      if (params.status) queryParams.set('status', params.status);
      if (params.isVisible !== undefined) queryParams.set('isVisible', String(params.isVisible));
      if (params.isDefault !== undefined) queryParams.set('isDefault', String(params.isDefault));
      if (params.departmentId) queryParams.set('departmentId', params.departmentId);
      if (params.includeChildren !== undefined) queryParams.set('includeChildren', String(params.includeChildren));
      if (params.includePostCount !== undefined) queryParams.set('includePostCount', String(params.includePostCount));
      if (params.includeDeleted !== undefined) queryParams.set('includeDeleted', String(params.includeDeleted));
      if (params.treeStructure !== undefined) queryParams.set('treeStructure', String(params.treeStructure));
      if (params.language) queryParams.set('language', params.language);
      if (params.skip !== undefined) queryParams.set('skip', String(params.skip));
      if (params.limit !== undefined) queryParams.set('limit', String(params.limit));
      if (params.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    const response = await this.httpClient.request<CategoryListResponse>(
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
      throw new Error(response.error || 'Failed to fetch categories');
    }

    return response;
  }

  /**
   * Get category tree structure
   * Uses /tree endpoint pattern
   */
  async getTree(params?: Pick<CategoryQuery, 'departmentId' | 'language' | 'includePostCount'>): Promise<ApiResponse<CategoryTreeNode[]>> {
    let endpoint = `${CATEGORY_BASE}/tree`;
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.departmentId) queryParams.set('departmentId', params.departmentId);
      if (params.language) queryParams.set('language', params.language);
      if (params.includePostCount !== undefined) queryParams.set('includePostCount', String(params.includePostCount));
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    const response = await this.httpClient.request<CategoryTreeNode[]>(
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
      throw new Error(response.error || 'Failed to fetch category tree');
    }

    return response;
  }

  /**
   * Get a single category by ID
   */
  async getById(id: string): Promise<ApiResponse<Category>> {
    const response = await this.httpClient.request<Category>(
      `${CATEGORY_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to fetch category');
    }

    return response;
  }

  /**
   * Get a category by slug
   */
  async getBySlug(slug: string): Promise<ApiResponse<Category>> {
    const response = await this.httpClient.request<Category>(
      `${CATEGORY_BASE}/slug/${slug}`,
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
      throw new Error(response.error || 'Failed to fetch category by slug');
    }

    return response;
  }

  /**
   * Update a category
   */
  async update(id: string, data: UpdateCategoryDto): Promise<ApiResponse<Category>> {
    const response = await this.httpClient.request<Category>(
      `${CATEGORY_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to update category');
    }

    return response;
  }

  /**
   * Delete a category (soft delete)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${CATEGORY_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to delete category');
    }

    return response;
  }

  /**
   * Move a category to a new parent or position
   */
  async move(id: string, data: MoveCategoryDto): Promise<ApiResponse<Category>> {
    const response = await this.httpClient.request<Category>(
      `${CATEGORY_BASE}/${id}/move`,
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
      throw new Error(response.error || 'Failed to move category');
    }

    return response;
  }

  /**
   * Reorder multiple categories
   */
  async reorder(data: ReorderCategoriesDto): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${CATEGORY_BASE}/reorder`,
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
      throw new Error(response.error || 'Failed to reorder categories');
    }

    return response;
  }

  /**
   * Get category children
   */
  async getChildren(parentId: string): Promise<ApiResponse<Category[]>> {
    const response = await this.httpClient.request<Category[]>(
      `${CATEGORY_BASE}/${parentId}/children`,
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
      throw new Error(response.error || 'Failed to fetch category children');
    }

    return response;
  }

  /**
   * Restore a soft-deleted category
   */
  async restore(id: string): Promise<ApiResponse<Category>> {
    const response = await this.httpClient.request<Category>(
      `${CATEGORY_BASE}/${id}/restore`,
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
      throw new Error(response.error || 'Failed to restore category');
    }

    return response;
  }
}
