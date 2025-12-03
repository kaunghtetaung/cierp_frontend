/**
 * Page Server Actions
 * Next.js 15 Server Actions for page management
 */

'use server';

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { PageService } from '../services/page.service';
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
} from '../types';

/**
 * Get page service instance with proper context
 */
async function getPageService(): Promise<PageService> {
  const headerStore = await headers();
  const [user, session] = await Promise.all([
    getCurrentUser(headerStore),
    getCurrentSession(headerStore),
  ]);

  if (!user || !session) {
    throw new Error('Authentication required');
  }

  const tenantId = headerStore.get('x-tenant-id') || user.tenantId || session.tenantId;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }

  const apiUrl = await getApiDomain();

  return new PageService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

/**
 * Create a new page
 */
export async function createPage(
  data: CreatePageDto
): Promise<ApiResponse<Page>> {
  try {
    if (!data.title?.en || !data.title?.mm) {
      return {
        success: false,
        error: 'Title is required in both languages',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getPageService();
    const response = await service.create(data);
    return response;
  } catch (error) {
    console.error('Create page error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create page',
      message: 'Create failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get pages list
 */
export async function getPages(
  params?: PageQuery
): Promise<ApiResponse<PageListResponse>> {
  try {
    const service = await getPageService();
    const response = await service.getAll(params);
    return response;
  } catch (error) {
    console.error('Get pages error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pages',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get page by ID
 */
export async function getPageById(
  id: string,
  includeSections: boolean = true
): Promise<ApiResponse<Page>> {
  try {
    const service = await getPageService();
    const response = await service.getById(id, includeSections);
    return response;
  } catch (error) {
    console.error('Get page error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch page',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get page by slug with breadcrumbs
 */
export async function getPageBySlug(
  slug: string
): Promise<ApiResponse<PageWithBreadcrumb>> {
  try {
    const service = await getPageService();
    const response = await service.getBySlug(slug);
    return response;
  } catch (error) {
    console.error('Get page by slug error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch page',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update a page
 */
export async function updatePage(
  id: string,
  data: UpdatePageDto
): Promise<ApiResponse<Page>> {
  try {
    const service = await getPageService();
    const response = await service.update(id, data);
    return response;
  } catch (error) {
    console.error('Update page error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update page',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Delete a page
 */
export async function deletePage(
  id: string
): Promise<ApiResponse<void>> {
  try {
    const service = await getPageService();
    const response = await service.delete(id);
    return response;
  } catch (error) {
    console.error('Delete page error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete page',
      message: 'Delete failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Publish a page
 */
export async function publishPage(
  id: string
): Promise<ApiResponse<Page>> {
  try {
    const service = await getPageService();
    const response = await service.publish(id);
    return response;
  } catch (error) {
    console.error('Publish page error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish page',
      message: 'Publish failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Unpublish a page
 */
export async function unpublishPage(
  id: string
): Promise<ApiResponse<Page>> {
  try {
    const service = await getPageService();
    const response = await service.unpublish(id);
    return response;
  } catch (error) {
    console.error('Unpublish page error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unpublish page',
      message: 'Unpublish failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Move a page
 */
export async function movePage(
  id: string,
  data: MovePageDto
): Promise<ApiResponse<Page>> {
  try {
    const service = await getPageService();
    const response = await service.move(id, data);
    return response;
  } catch (error) {
    console.error('Move page error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move page',
      message: 'Move failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Reorder pages
 */
export async function reorderPages(
  data: ReorderPagesDto
): Promise<ApiResponse<void>> {
  try {
    const service = await getPageService();
    const response = await service.reorder(data);
    return response;
  } catch (error) {
    console.error('Reorder pages error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder pages',
      message: 'Reorder failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Duplicate a page
 */
export async function duplicatePage(
  id: string,
  data?: DuplicatePageDto
): Promise<ApiResponse<Page>> {
  try {
    const service = await getPageService();
    const response = await service.duplicate(id, data);
    return response;
  } catch (error) {
    console.error('Duplicate page error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate page',
      message: 'Duplicate failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Add section to page
 */
export async function addSectionToPage(
  pageId: string,
  data: AddSectionToPageDto
): Promise<ApiResponse<Page>> {
  try {
    const service = await getPageService();
    const response = await service.addSection(pageId, data);
    return response;
  } catch (error) {
    console.error('Add section to page error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add section',
      message: 'Add section failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Remove section from page
 */
export async function removeSectionFromPage(
  pageId: string,
  data: RemoveSectionFromPageDto
): Promise<ApiResponse<Page>> {
  try {
    const service = await getPageService();
    const response = await service.removeSection(pageId, data);
    return response;
  } catch (error) {
    console.error('Remove section from page error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove section',
      message: 'Remove section failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Reorder page sections
 */
export async function reorderPageSections(
  pageId: string,
  data: ReorderPageSectionsDto
): Promise<ApiResponse<Page>> {
  try {
    const service = await getPageService();
    const response = await service.reorderSections(pageId, data);
    return response;
  } catch (error) {
    console.error('Reorder page sections error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder sections',
      message: 'Reorder sections failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get page revisions
 */
export async function getPageRevisions(
  pageId: string
): Promise<ApiResponse<PageRevision[]>> {
  try {
    const service = await getPageService();
    const response = await service.getRevisions(pageId);
    return response;
  } catch (error) {
    console.error('Get page revisions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch revisions',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get page statistics
 */
export async function getPageStatistics(
  departmentId?: string
): Promise<ApiResponse<PageStatistics>> {
  try {
    const service = await getPageService();
    const response = await service.getStatistics(departmentId);
    return response;
  } catch (error) {
    console.error('Get page statistics error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Bulk page operation
 */
export async function bulkPageOperation(
  data: BulkPageOperation
): Promise<ApiResponse<{ affected: number }>> {
  try {
    const service = await getPageService();
    const response = await service.bulkOperation(data);
    return response;
  } catch (error) {
    console.error('Bulk page operation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform bulk operation',
      message: 'Bulk operation failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Restore a deleted page
 */
export async function restorePage(
  id: string
): Promise<ApiResponse<Page>> {
  try {
    const service = await getPageService();
    const response = await service.restore(id);
    return response;
  } catch (error) {
    console.error('Restore page error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore page',
      message: 'Restore failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Set page as home page
 */
export async function setPageAsHomePage(
  id: string
): Promise<ApiResponse<Page>> {
  try {
    const service = await getPageService();
    const response = await service.setAsHomePage(id);
    return response;
  } catch (error) {
    console.error('Set home page error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set as home page',
      message: 'Set home page failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}
