/**
 * Section Service
 * Handles all API calls to the section module
 * Following ModuleService pattern with httpClient.request()
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type { ApiResponse } from '@repo/types';
import type {
  Section,
  SectionType,
  SectionQuery,
  UpdateSectionDto,
  BulkFindSectionsDto,
  SectionListResponse,
  SectionDetailResponse,
} from '../types';

// Base endpoint for section API
// Backend URL structure: http://api-dev.tenant.com/content/sections
// Following API gateway pattern: /{serviceName}/{module}
// serviceName = content, module = sections
const SECTION_BASE = '/content/sections';

/**
 * Section Service Class
 * Follows ModuleService pattern with proper request config
 */
export class SectionService {
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
   * Create a new section
   * The section type determines the shape of the data
   */
  async create<T extends Section>(data: Omit<T, '_id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'version'>): Promise<ApiResponse<T>> {
    const response = await this.httpClient.request<T>(
      SECTION_BASE,
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
      throw new Error(response.error || 'Failed to create section');
    }

    return response;
  }

  /**
   * Get paginated list of sections with optional filters
   */
  async getAll(params?: SectionQuery): Promise<ApiResponse<SectionListResponse>> {
    let endpoint = SECTION_BASE;
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.search) queryParams.set('search', params.search);
      if (params.type) queryParams.set('type', params.type);
      if (params.status) queryParams.set('status', params.status);
      if (params.isReusable !== undefined) queryParams.set('isReusable', String(params.isReusable));
      if (params.isVisible !== undefined) queryParams.set('isVisible', String(params.isVisible));
      if (params.departmentId) queryParams.set('departmentId', params.departmentId);
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

    const response = await this.httpClient.request<SectionListResponse>(
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
      throw new Error(response.error || 'Failed to fetch sections');
    }

    return response;
  }

  /**
   * Get all reusable sections
   */
  async getReusable(departmentId?: string): Promise<ApiResponse<Section[]>> {
    let endpoint = `${SECTION_BASE}/reusable`;
    if (departmentId) {
      endpoint += `?departmentId=${departmentId}`;
    }

    const response = await this.httpClient.request<Section[]>(
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
      throw new Error(response.error || 'Failed to fetch reusable sections');
    }

    return response;
  }

  /**
   * Get a single section by ID
   */
  async getById(id: string): Promise<ApiResponse<Section>> {
    const response = await this.httpClient.request<Section>(
      `${SECTION_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to fetch section');
    }

    return response;
  }

  /**
   * Update a section
   */
  async update(id: string, data: UpdateSectionDto): Promise<ApiResponse<Section>> {
    const response = await this.httpClient.request<Section>(
      `${SECTION_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to update section');
    }

    return response;
  }

  /**
   * Delete a section (soft delete)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${SECTION_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to delete section');
    }

    return response;
  }

  /**
   * Find multiple sections by IDs
   */
  async findByIds(data: BulkFindSectionsDto): Promise<ApiResponse<Section[]>> {
    const response = await this.httpClient.request<Section[]>(
      `${SECTION_BASE}/bulk/find-by-ids`,
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
      throw new Error(response.error || 'Failed to find sections');
    }

    return response;
  }

  /**
   * Duplicate a section
   */
  async duplicate(id: string, newName?: string): Promise<ApiResponse<Section>> {
    const response = await this.httpClient.request<Section>(
      `${SECTION_BASE}/${id}/duplicate`,
      {
        method: 'POST',
        body: newName ? { name: newName } : undefined,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to duplicate section');
    }

    return response;
  }

  /**
   * Toggle section visibility
   */
  async toggleVisibility(id: string): Promise<ApiResponse<Section>> {
    const response = await this.httpClient.request<Section>(
      `${SECTION_BASE}/${id}/toggle-visibility`,
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
      throw new Error(response.error || 'Failed to toggle visibility');
    }

    return response;
  }

  /**
   * Restore a soft-deleted section
   */
  async restore(id: string): Promise<ApiResponse<Section>> {
    const response = await this.httpClient.request<Section>(
      `${SECTION_BASE}/${id}/restore`,
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
      throw new Error(response.error || 'Failed to restore section');
    }

    return response;
  }

  /**
   * Get sections by type
   */
  async getByType(type: SectionType, departmentId?: string): Promise<ApiResponse<Section[]>> {
    let endpoint = `${SECTION_BASE}/type/${type}`;
    if (departmentId) {
      endpoint += `?departmentId=${departmentId}`;
    }

    const response = await this.httpClient.request<Section[]>(
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
      throw new Error(response.error || 'Failed to fetch sections by type');
    }

    return response;
  }
}
