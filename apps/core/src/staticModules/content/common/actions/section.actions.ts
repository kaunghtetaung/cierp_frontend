/**
 * Section Server Actions
 * Next.js 15 Server Actions for section management
 */

'use server';

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { SectionService } from '../services/section.service';
import type { ApiResponse } from '@repo/types';
import type {
  Section,
  SectionType,
  SectionQuery,
  UpdateSectionDto,
  BulkFindSectionsDto,
  SectionListResponse,
} from '../types';

/**
 * Get section service instance with proper context
 */
async function getSectionService(): Promise<SectionService> {
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

  return new SectionService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

/**
 * Create a new section
 */
export async function createSection<T extends Section>(
  data: Omit<T, '_id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'version'>
): Promise<ApiResponse<T>> {
  try {
    if (!data.name) {
      return {
        success: false,
        error: 'Section name is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    if (!data.type) {
      return {
        success: false,
        error: 'Section type is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getSectionService();
    const response = await service.create<T>(data);
    return response;
  } catch (error) {
    console.error('Create section error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create section',
      message: 'Create failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get sections list
 */
export async function getSections(
  params?: SectionQuery
): Promise<ApiResponse<SectionListResponse>> {
  try {
    const service = await getSectionService();
    const response = await service.getAll(params);
    return response;
  } catch (error) {
    console.error('Get sections error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sections',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get reusable sections
 */
export async function getReusableSections(
  departmentId?: string
): Promise<ApiResponse<Section[]>> {
  try {
    const service = await getSectionService();
    const response = await service.getReusable(departmentId);
    return response;
  } catch (error) {
    console.error('Get reusable sections error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reusable sections',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get section by ID
 */
export async function getSectionById(
  id: string
): Promise<ApiResponse<Section>> {
  try {
    const service = await getSectionService();
    const response = await service.getById(id);
    return response;
  } catch (error) {
    console.error('Get section error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch section',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update a section
 */
export async function updateSection(
  id: string,
  data: UpdateSectionDto
): Promise<ApiResponse<Section>> {
  try {
    const service = await getSectionService();
    const response = await service.update(id, data);
    return response;
  } catch (error) {
    console.error('Update section error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update section',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Delete a section
 */
export async function deleteSection(
  id: string
): Promise<ApiResponse<void>> {
  try {
    const service = await getSectionService();
    const response = await service.delete(id);
    return response;
  } catch (error) {
    console.error('Delete section error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete section',
      message: 'Delete failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Find sections by IDs
 */
export async function findSectionsByIds(
  data: BulkFindSectionsDto
): Promise<ApiResponse<Section[]>> {
  try {
    const service = await getSectionService();
    const response = await service.findByIds(data);
    return response;
  } catch (error) {
    console.error('Find sections by IDs error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find sections',
      message: 'Find failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Duplicate a section
 */
export async function duplicateSection(
  id: string,
  newName?: string
): Promise<ApiResponse<Section>> {
  try {
    const service = await getSectionService();
    const response = await service.duplicate(id, newName);
    return response;
  } catch (error) {
    console.error('Duplicate section error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate section',
      message: 'Duplicate failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Toggle section visibility
 */
export async function toggleSectionVisibility(
  id: string
): Promise<ApiResponse<Section>> {
  try {
    const service = await getSectionService();
    const response = await service.toggleVisibility(id);
    return response;
  } catch (error) {
    console.error('Toggle section visibility error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle visibility',
      message: 'Toggle failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Restore a deleted section
 */
export async function restoreSection(
  id: string
): Promise<ApiResponse<Section>> {
  try {
    const service = await getSectionService();
    const response = await service.restore(id);
    return response;
  } catch (error) {
    console.error('Restore section error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore section',
      message: 'Restore failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get sections by type
 */
export async function getSectionsByType(
  type: SectionType,
  departmentId?: string
): Promise<ApiResponse<Section[]>> {
  try {
    const service = await getSectionService();
    const response = await service.getByType(type, departmentId);
    return response;
  } catch (error) {
    console.error('Get sections by type error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sections',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}
