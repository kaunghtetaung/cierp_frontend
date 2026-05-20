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
    // Backend DTO is `name: string`. Accept either a string or a multilang
    // object (legacy callers) and normalize to the string the API expects.
    const rawName: any = (data as any).name;
    const normalizedName: string =
      typeof rawName === 'string'
        ? rawName.trim()
        : (rawName?.en || rawName?.mm || '').toString().trim();

    if (!normalizedName) {
      return {
        success: false,
        error: 'Name is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const payload = { ...data, name: normalizedName } as any;
    const service = await getCategoryService();
    const response = await service.create(payload);
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
 * Lightweight reference lookup for dropdowns — `{ id, label, value }` items.
 * Goes Next.js (server-side, with auth token) → API gateway → content
 * service `/categories/ref`.
 */
export async function getCategoryReference(
  params?: { search?: string; limit?: number; status?: string }
): Promise<
  ApiResponse<Array<{ id: string; label: string; value: string }>>
> {
  try {
    const service = await getCategoryService();
    const response = await service.getReference(params);
    if (response.success && response.data) {
      // The shared StandardResponseHandler unwraps `body.data` automatically,
      // so `response.data` is already the array. Older code paths returned
      // the full wrapper; handle both for safety.
      const raw: any = response.data;
      const list: Array<{ id: string; label: string; value: string }> =
        Array.isArray(raw) ? raw : (raw.data || []);
      return {
        success: true,
        data: list,
        message:
          (typeof raw === 'object' && !Array.isArray(raw) && raw.message) ||
          'OK',
        timestamp: new Date(),
      } as ApiResponse<Array<{ id: string; label: string; value: string }>>;
    }
    return {
      success: false,
      error: response.error || 'Failed to fetch category reference',
      message: 'Fetch failed',
      data: [] as any,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Get category reference error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch category reference',
      message: 'Fetch failed',
      data: [] as any,
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
    // Backend returns `{ data: [...], meta: {...} }` and the shared
    // response handler preserves the wrap (so paginated callers can
    // read meta). The declared return type is `ApiResponse<...[]>` —
    // callers expect `result.data` to BE the array. Unwrap one level
    // here so categories/page.tsx and other consumers can do
    // `setCategories(result.data)` directly, matching the shape of
    // every other array-returning action in this file.
    if (
      response.success &&
      response.data &&
      typeof response.data === 'object' &&
      !Array.isArray(response.data) &&
      Array.isArray((response.data as any).data)
    ) {
      return { ...response, data: (response.data as any).data };
    }
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
