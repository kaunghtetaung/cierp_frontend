/**
 * Category Server Actions
 * Next.js 15 Server Actions for category management
 */

'use server';

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { CategoryService } from '../services/category.service';
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
} from '../types';

/**
 * Get category service instance with proper context
 */
async function getCategoryService(): Promise<CategoryService> {
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

  return new CategoryService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

/**
 * Create a new category
 */
export async function createCategory(
  data: CreateCategoryDto
): Promise<ApiResponse<Category>> {
  try {
    if (!data.name?.en || !data.name?.mm) {
      return {
        success: false,
        error: 'Name is required in both languages',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getCategoryService();
    const response = await service.create(data);
    return response;
  } catch (error) {
    console.error('Create category error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create category',
      message: 'Create failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get categories list
 */
export async function getCategories(
  params?: CategoryQuery
): Promise<ApiResponse<CategoryListResponse>> {
  try {
    const service = await getCategoryService();
    const response = await service.getAll(params);
    return response;
  } catch (error) {
    console.error('Get categories error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch categories',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get category tree
 */
export async function getCategoryTree(
  params?: Pick<CategoryQuery, 'departmentId' | 'language' | 'includePostCount'>
): Promise<ApiResponse<CategoryTreeNode[]>> {
  try {
    const service = await getCategoryService();
    const response = await service.getTree(params);
    return response;
  } catch (error) {
    console.error('Get category tree error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch category tree',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get category by ID
 */
export async function getCategoryById(
  id: string
): Promise<ApiResponse<Category>> {
  try {
    const service = await getCategoryService();
    const response = await service.getById(id);
    return response;
  } catch (error) {
    console.error('Get category error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch category',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update a category
 */
export async function updateCategory(
  id: string,
  data: UpdateCategoryDto
): Promise<ApiResponse<Category>> {
  try {
    const service = await getCategoryService();
    const response = await service.update(id, data);
    return response;
  } catch (error) {
    console.error('Update category error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update category',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(
  id: string
): Promise<ApiResponse<void>> {
  try {
    const service = await getCategoryService();
    const response = await service.delete(id);
    return response;
  } catch (error) {
    console.error('Delete category error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete category',
      message: 'Delete failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Move a category
 */
export async function moveCategory(
  id: string,
  data: MoveCategoryDto
): Promise<ApiResponse<Category>> {
  try {
    const service = await getCategoryService();
    const response = await service.move(id, data);
    return response;
  } catch (error) {
    console.error('Move category error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move category',
      message: 'Move failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Reorder categories
 */
export async function reorderCategories(
  data: ReorderCategoriesDto
): Promise<ApiResponse<void>> {
  try {
    const service = await getCategoryService();
    const response = await service.reorder(data);
    return response;
  } catch (error) {
    console.error('Reorder categories error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder categories',
      message: 'Reorder failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Restore a deleted category
 */
export async function restoreCategory(
  id: string
): Promise<ApiResponse<Category>> {
  try {
    const service = await getCategoryService();
    const response = await service.restore(id);
    return response;
  } catch (error) {
    console.error('Restore category error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore category',
      message: 'Restore failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}
