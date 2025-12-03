/**
 * Navigation Service
 * Handles all API calls to the navigation module
 * Following ModuleService pattern with httpClient.request()
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type { ApiResponse } from '@repo/types';
import type {
  Navigation,
  MenuTreeNode,
  MenuType,
  CreateNavigationDto,
  UpdateNavigationDto,
  NavigationQuery,
  ReorderNavigationDto,
  MoveNavigationDto,
  NavigationFlatItem,
  BulkNavigationOperation,
  NavigationListResponse,
  NavigationFlatListResponse,
  MenuTreeResponse,
  NavigationDetailResponse,
} from '../types';

// Base endpoint for navigation API
// Backend URL structure: http://api-dev.tenant.com/content/navigations
// Following API gateway pattern: /{serviceName}/{module}
// serviceName = content, module = navigations
const NAVIGATION_BASE = '/content/navigations';

/**
 * Navigation Service Class
 * Follows ModuleService pattern with proper request config
 */
export class NavigationService {
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
   * Create a new navigation item
   */
  async create(data: CreateNavigationDto): Promise<ApiResponse<Navigation>> {
    const response = await this.httpClient.request<Navigation>(
      NAVIGATION_BASE,
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
      throw new Error(response.error || 'Failed to create navigation item');
    }

    return response;
  }

  /**
   * Get paginated list of navigation items with optional filters
   */
  async getAll(params?: NavigationQuery): Promise<ApiResponse<NavigationListResponse>> {
    let endpoint = NAVIGATION_BASE;
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.search) queryParams.set('search', params.search);
      if (params.menuType) queryParams.set('menuType', params.menuType);
      if (params.type) queryParams.set('type', params.type);
      if (params.parentId) queryParams.set('parentId', params.parentId);
      if (params.level !== undefined) queryParams.set('level', String(params.level));
      if (params.status) queryParams.set('status', params.status);
      if (params.visibility) queryParams.set('visibility', params.visibility);
      if (params.isVisible !== undefined) queryParams.set('isVisible', String(params.isVisible));
      if (params.requiresAuth !== undefined) queryParams.set('requiresAuth', String(params.requiresAuth));
      if (params.departmentId) queryParams.set('departmentId', params.departmentId);
      if (params.language) queryParams.set('language', params.language);
      if (params.includeChildren !== undefined) queryParams.set('includeChildren', String(params.includeChildren));
      if (params.flatStructure !== undefined) queryParams.set('flatStructure', String(params.flatStructure));
      if (params.filterByUserAccess !== undefined) queryParams.set('filterByUserAccess', String(params.filterByUserAccess));
      if (params.includeDeleted !== undefined) queryParams.set('includeDeleted', String(params.includeDeleted));
      if (params.skip !== undefined) queryParams.set('skip', String(params.skip));
      if (params.limit !== undefined) queryParams.set('limit', String(params.limit));
      if (params.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    const response = await this.httpClient.request<NavigationListResponse>(
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
      throw new Error(response.error || 'Failed to fetch navigation items');
    }

    return response;
  }

  /**
   * Get menu tree by type
   */
  async getMenuTree(menuType: MenuType, language: string = 'en'): Promise<ApiResponse<MenuTreeNode[]>> {
    const response = await this.httpClient.request<MenuTreeNode[]>(
      `${NAVIGATION_BASE}/menu/${menuType}?language=${language}`,
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
      throw new Error(response.error || 'Failed to fetch menu tree');
    }

    return response;
  }

  /**
   * Get filtered menu tree (role-based filtering for public site)
   */
  async getFilteredMenuTree(menuType: MenuType, language: string = 'en'): Promise<ApiResponse<MenuTreeNode[]>> {
    const response = await this.httpClient.request<MenuTreeNode[]>(
      `${NAVIGATION_BASE}/menu/${menuType}/filtered?language=${language}`,
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
      throw new Error(response.error || 'Failed to fetch filtered menu tree');
    }

    return response;
  }

  /**
   * Get a single navigation item by ID
   */
  async getById(id: string): Promise<ApiResponse<Navigation>> {
    const response = await this.httpClient.request<Navigation>(
      `${NAVIGATION_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to fetch navigation item');
    }

    return response;
  }

  /**
   * Update a navigation item
   */
  async update(id: string, data: UpdateNavigationDto): Promise<ApiResponse<Navigation>> {
    const response = await this.httpClient.request<Navigation>(
      `${NAVIGATION_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to update navigation item');
    }

    return response;
  }

  /**
   * Delete a navigation item (soft delete)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${NAVIGATION_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to delete navigation item');
    }

    return response;
  }

  /**
   * Reorder navigation items
   */
  async reorder(data: ReorderNavigationDto): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${NAVIGATION_BASE}/reorder`,
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
      throw new Error(response.error || 'Failed to reorder navigation items');
    }

    return response;
  }

  /**
   * Move a navigation item to a new parent or position
   */
  async move(id: string, data: MoveNavigationDto): Promise<ApiResponse<Navigation>> {
    const response = await this.httpClient.request<Navigation>(
      `${NAVIGATION_BASE}/${id}/move`,
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
      throw new Error(response.error || 'Failed to move navigation item');
    }

    return response;
  }

  /**
   * Bulk operation on navigation items
   */
  async bulkOperation(data: BulkNavigationOperation): Promise<ApiResponse<{ affected: number }>> {
    const response = await this.httpClient.request<{ affected: number }>(
      `${NAVIGATION_BASE}/bulk/${data.operation}`,
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
   * Restore a soft-deleted navigation item
   */
  async restore(id: string): Promise<ApiResponse<Navigation>> {
    const response = await this.httpClient.request<Navigation>(
      `${NAVIGATION_BASE}/${id}/restore`,
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
      throw new Error(response.error || 'Failed to restore navigation item');
    }

    return response;
  }

  /**
   * Get navigation items as flat list with depth info
   */
  async getFlatList(menuType: MenuType): Promise<ApiResponse<NavigationFlatItem[]>> {
    const response = await this.httpClient.request<NavigationFlatItem[]>(
      `${NAVIGATION_BASE}?menuType=${menuType}&flatStructure=true`,
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
      throw new Error(response.error || 'Failed to fetch flat navigation list');
    }

    return response;
  }
}
