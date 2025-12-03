/**
 * Page Service
 * Handles all API calls to the page module
 * Following ModuleService pattern with httpClient.request()
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type { ApiResponse } from '@repo/types';
import type {
  Page,
  PageTreeNode,
  PageRevision,
  CreatePageDto,
  UpdatePageDto,
  PageQuery,
  MovePageDto,
  ReorderPagesDto,
  DuplicatePageDto,
  AddSectionToPageDto,
  RemoveSectionFromPageDto,
  ReorderPageSectionsDto,
  PageWithBreadcrumb,
  PageStatistics,
  BulkPageOperation,
  PageListResponse,
  PageTreeResponse,
  PageDetailResponse,
  PageRevisionListResponse,
  PageStatisticsResponse,
} from '../types';

// Base endpoint for page API
// Backend URL structure: http://api-dev.tenant.com/content/page
// Following API gateway pattern: /{serviceName}/{module}
// serviceName = content, module = page
const PAGE_BASE = '/content/page';

/**
 * Page Service Class
 * Follows ModuleService pattern with proper request config
 */
export class PageService {
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
   * Create a new page
   */
  async create(data: CreatePageDto): Promise<ApiResponse<Page>> {
    const response = await this.httpClient.request<Page>(
      PAGE_BASE,
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
      throw new Error(response.error || 'Failed to create page');
    }

    return response;
  }

  /**
   * Get paginated list of pages with optional filters
   */
  async getAll(params?: PageQuery): Promise<ApiResponse<PageListResponse>> {
    let endpoint = PAGE_BASE;
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.search) queryParams.set('search', params.search);
      if (params.parentId) queryParams.set('parentId', params.parentId);
      if (params.template) queryParams.set('template', params.template);
      if (params.status) queryParams.set('status', params.status);
      if (params.visibility) queryParams.set('visibility', params.visibility);
      if (params.showInNavigation !== undefined) queryParams.set('showInNavigation', String(params.showInNavigation));
      if (params.isHomePage !== undefined) queryParams.set('isHomePage', String(params.isHomePage));
      if (params.departmentId) queryParams.set('departmentId', params.departmentId);
      if (params.level !== undefined) queryParams.set('level', String(params.level));
      if (params.includeChildren !== undefined) queryParams.set('includeChildren', String(params.includeChildren));
      if (params.includeSections !== undefined) queryParams.set('includeSections', String(params.includeSections));
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

    const response = await this.httpClient.request<PageListResponse>(
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
      throw new Error(response.error || 'Failed to fetch pages');
    }

    return response;
  }

  /**
   * Get a single page by ID
   */
  async getById(id: string, includeSections: boolean = true): Promise<ApiResponse<Page>> {
    let endpoint = `${PAGE_BASE}/${id}`;
    if (includeSections) {
      endpoint += '?includeSections=true';
    }

    const response = await this.httpClient.request<Page>(
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
      throw new Error(response.error || 'Failed to fetch page');
    }

    return response;
  }

  /**
   * Get a page by slug with breadcrumbs
   */
  async getBySlug(slug: string): Promise<ApiResponse<PageWithBreadcrumb>> {
    const response = await this.httpClient.request<PageWithBreadcrumb>(
      `${PAGE_BASE}/slug/${slug}`,
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
      throw new Error(response.error || 'Failed to fetch page by slug');
    }

    return response;
  }

  /**
   * Update a page
   */
  async update(id: string, data: UpdatePageDto): Promise<ApiResponse<Page>> {
    const response = await this.httpClient.request<Page>(
      `${PAGE_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to update page');
    }

    return response;
  }

  /**
   * Delete a page (soft delete)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${PAGE_BASE}/${id}`,
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
      throw new Error(response.error || 'Failed to delete page');
    }

    return response;
  }

  /**
   * Publish a page
   */
  async publish(id: string): Promise<ApiResponse<Page>> {
    const response = await this.httpClient.request<Page>(
      `${PAGE_BASE}/${id}/publish`,
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
      throw new Error(response.error || 'Failed to publish page');
    }

    return response;
  }

  /**
   * Unpublish a page
   */
  async unpublish(id: string): Promise<ApiResponse<Page>> {
    const response = await this.httpClient.request<Page>(
      `${PAGE_BASE}/${id}/unpublish`,
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
      throw new Error(response.error || 'Failed to unpublish page');
    }

    return response;
  }

  /**
   * Move a page to a new parent or position
   */
  async move(id: string, data: MovePageDto): Promise<ApiResponse<Page>> {
    const response = await this.httpClient.request<Page>(
      `${PAGE_BASE}/${id}/move`,
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
      throw new Error(response.error || 'Failed to move page');
    }

    return response;
  }

  /**
   * Reorder multiple pages
   */
  async reorder(data: ReorderPagesDto): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${PAGE_BASE}/reorder`,
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
      throw new Error(response.error || 'Failed to reorder pages');
    }

    return response;
  }

  /**
   * Duplicate a page
   */
  async duplicate(id: string, data?: DuplicatePageDto): Promise<ApiResponse<Page>> {
    const response = await this.httpClient.request<Page>(
      `${PAGE_BASE}/${id}/duplicate`,
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
      throw new Error(response.error || 'Failed to duplicate page');
    }

    return response;
  }

  /**
   * Add a section to a page
   */
  async addSection(pageId: string, data: AddSectionToPageDto): Promise<ApiResponse<Page>> {
    const response = await this.httpClient.request<Page>(
      `${PAGE_BASE}/${pageId}/sections`,
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
      throw new Error(response.error || 'Failed to add section to page');
    }

    return response;
  }

  /**
   * Remove a section from a page
   */
  async removeSection(pageId: string, data: RemoveSectionFromPageDto): Promise<ApiResponse<Page>> {
    const response = await this.httpClient.request<Page>(
      `${PAGE_BASE}/${pageId}/sections/${data.sectionId}`,
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
      throw new Error(response.error || 'Failed to remove section from page');
    }

    return response;
  }

  /**
   * Reorder sections on a page
   */
  async reorderSections(pageId: string, data: ReorderPageSectionsDto): Promise<ApiResponse<Page>> {
    const response = await this.httpClient.request<Page>(
      `${PAGE_BASE}/${pageId}/sections/reorder`,
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
      throw new Error(response.error || 'Failed to reorder sections');
    }

    return response;
  }

  /**
   * Get page revisions
   */
  async getRevisions(pageId: string): Promise<ApiResponse<PageRevision[]>> {
    const response = await this.httpClient.request<PageRevision[]>(
      `${PAGE_BASE}/${pageId}/revisions`,
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
      throw new Error(response.error || 'Failed to fetch page revisions');
    }

    return response;
  }

  /**
   * Restore a page to a specific revision
   */
  async restoreRevision(pageId: string, revisionId: string): Promise<ApiResponse<Page>> {
    const response = await this.httpClient.request<Page>(
      `${PAGE_BASE}/${pageId}/revisions/${revisionId}/restore`,
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
      throw new Error(response.error || 'Failed to restore page revision');
    }

    return response;
  }

  /**
   * Get page statistics
   */
  async getStatistics(departmentId?: string): Promise<ApiResponse<PageStatistics>> {
    let endpoint = `${PAGE_BASE}/statistics`;
    if (departmentId) {
      endpoint += `?departmentId=${departmentId}`;
    }

    const response = await this.httpClient.request<PageStatistics>(
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
      throw new Error(response.error || 'Failed to fetch page statistics');
    }

    return response;
  }

  /**
   * Bulk operation on pages
   */
  async bulkOperation(data: BulkPageOperation): Promise<ApiResponse<{ affected: number }>> {
    const response = await this.httpClient.request<{ affected: number }>(
      `${PAGE_BASE}/bulk/${data.operation}`,
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
   * Restore a soft-deleted page
   */
  async restore(id: string): Promise<ApiResponse<Page>> {
    const response = await this.httpClient.request<Page>(
      `${PAGE_BASE}/${id}/restore`,
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
      throw new Error(response.error || 'Failed to restore page');
    }

    return response;
  }

  /**
   * Set page as home page
   */
  async setAsHomePage(id: string): Promise<ApiResponse<Page>> {
    const response = await this.httpClient.request<Page>(
      `${PAGE_BASE}/${id}/set-home`,
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
      throw new Error(response.error || 'Failed to set as home page');
    }

    return response;
  }
}
