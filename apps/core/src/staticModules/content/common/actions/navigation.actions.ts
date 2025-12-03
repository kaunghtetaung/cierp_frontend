/**
 * Navigation Server Actions
 * Next.js 15 Server Actions for navigation management
 */

'use server';

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { NavigationService } from '../services/navigation.service';
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
} from '../types';

/**
 * Get navigation service instance with proper context
 */
async function getNavigationService(): Promise<NavigationService> {
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

  return new NavigationService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

/**
 * Create a new navigation item
 */
export async function createNavigationItem(
  data: CreateNavigationDto
): Promise<ApiResponse<Navigation>> {
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

    if (!data.menuType) {
      return {
        success: false,
        error: 'Menu type is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getNavigationService();
    const response = await service.create(data);
    return response;
  } catch (error) {
    console.error('Create navigation item error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create navigation item',
      message: 'Create failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get navigation items list
 */
export async function getNavigationItems(
  params?: NavigationQuery
): Promise<ApiResponse<NavigationListResponse>> {
  try {
    const service = await getNavigationService();
    const response = await service.getAll(params);
    return response;
  } catch (error) {
    console.error('Get navigation items error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch navigation items',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get menu tree by type
 */
export async function getMenuTree(
  menuType: MenuType,
  language: string = 'en'
): Promise<ApiResponse<MenuTreeNode[]>> {
  try {
    const service = await getNavigationService();
    const response = await service.getMenuTree(menuType, language);
    return response;
  } catch (error) {
    console.error('Get menu tree error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch menu tree',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get filtered menu tree (for public site)
 */
export async function getFilteredMenuTree(
  menuType: MenuType,
  language: string = 'en'
): Promise<ApiResponse<MenuTreeNode[]>> {
  try {
    const service = await getNavigationService();
    const response = await service.getFilteredMenuTree(menuType, language);
    return response;
  } catch (error) {
    console.error('Get filtered menu tree error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch menu tree',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get navigation item by ID
 */
export async function getNavigationItemById(
  id: string
): Promise<ApiResponse<Navigation>> {
  try {
    const service = await getNavigationService();
    const response = await service.getById(id);
    return response;
  } catch (error) {
    console.error('Get navigation item error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch navigation item',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update a navigation item
 */
export async function updateNavigationItem(
  id: string,
  data: UpdateNavigationDto
): Promise<ApiResponse<Navigation>> {
  try {
    const service = await getNavigationService();
    const response = await service.update(id, data);
    return response;
  } catch (error) {
    console.error('Update navigation item error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update navigation item',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Delete a navigation item
 */
export async function deleteNavigationItem(
  id: string
): Promise<ApiResponse<void>> {
  try {
    const service = await getNavigationService();
    const response = await service.delete(id);
    return response;
  } catch (error) {
    console.error('Delete navigation item error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete navigation item',
      message: 'Delete failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Reorder navigation items
 */
export async function reorderNavigationItems(
  data: ReorderNavigationDto
): Promise<ApiResponse<void>> {
  try {
    const service = await getNavigationService();
    const response = await service.reorder(data);
    return response;
  } catch (error) {
    console.error('Reorder navigation items error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder navigation items',
      message: 'Reorder failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Move a navigation item
 */
export async function moveNavigationItem(
  id: string,
  data: MoveNavigationDto
): Promise<ApiResponse<Navigation>> {
  try {
    const service = await getNavigationService();
    const response = await service.move(id, data);
    return response;
  } catch (error) {
    console.error('Move navigation item error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move navigation item',
      message: 'Move failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Bulk navigation operation
 */
export async function bulkNavigationOperation(
  data: BulkNavigationOperation
): Promise<ApiResponse<{ affected: number }>> {
  try {
    const service = await getNavigationService();
    const response = await service.bulkOperation(data);
    return response;
  } catch (error) {
    console.error('Bulk navigation operation error:', error);
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
 * Restore a deleted navigation item
 */
export async function restoreNavigationItem(
  id: string
): Promise<ApiResponse<Navigation>> {
  try {
    const service = await getNavigationService();
    const response = await service.restore(id);
    return response;
  } catch (error) {
    console.error('Restore navigation item error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore navigation item',
      message: 'Restore failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get flat navigation list
 */
export async function getNavigationFlatList(
  menuType: MenuType
): Promise<ApiResponse<NavigationFlatItem[]>> {
  try {
    const service = await getNavigationService();
    const response = await service.getFlatList(menuType);
    return response;
  } catch (error) {
    console.error('Get navigation flat list error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch navigation list',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}
