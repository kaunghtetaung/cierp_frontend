/**
 * Post Type Server Actions
 * Next.js 15 Server Actions for post type management
 */

'use server';

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { PostTypeService } from '../services/post-type.service';
import type { ApiResponse } from '@repo/types';
import type {
  PostType,
  CreatePostTypeDto,
  UpdatePostTypeDto,
  PostTypeQuery,
  AddAttributeDto,
  UpdateAttributeDto,
  RemoveAttributeDto,
  ReorderAttributesDto,
  PostTypeListResponse,
} from '../types';

/**
 * Get post type service instance with proper context
 */
async function getPostTypeService(): Promise<PostTypeService> {
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

  return new PostTypeService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

/**
 * Create a new post type
 */
export async function createPostType(
  data: CreatePostTypeDto
): Promise<ApiResponse<PostType>> {
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

    const service = await getPostTypeService();
    const response = await service.create(data);
    return response;
  } catch (error) {
    console.error('Create post type error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create post type',
      message: 'Create failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get post types list
 */
export async function getPostTypes(
  params?: PostTypeQuery
): Promise<ApiResponse<PostTypeListResponse>> {
  try {
    const service = await getPostTypeService();
    const response = await service.getAll(params);
    return response;
  } catch (error) {
    console.error('Get post types error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch post types',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get post type by ID
 */
export async function getPostTypeById(
  id: string
): Promise<ApiResponse<PostType>> {
  try {
    const service = await getPostTypeService();
    const response = await service.getById(id);
    return response;
  } catch (error) {
    console.error('Get post type error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch post type',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get post type by slug
 */
export async function getPostTypeBySlug(
  slug: string
): Promise<ApiResponse<PostType>> {
  try {
    const service = await getPostTypeService();
    const response = await service.getBySlug(slug);
    return response;
  } catch (error) {
    console.error('Get post type by slug error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch post type',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update a post type
 */
export async function updatePostType(
  id: string,
  data: UpdatePostTypeDto
): Promise<ApiResponse<PostType>> {
  try {
    const service = await getPostTypeService();
    const response = await service.update(id, data);
    return response;
  } catch (error) {
    console.error('Update post type error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update post type',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Delete a post type
 */
export async function deletePostType(
  id: string
): Promise<ApiResponse<void>> {
  try {
    const service = await getPostTypeService();
    const response = await service.delete(id);
    return response;
  } catch (error) {
    console.error('Delete post type error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete post type',
      message: 'Delete failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Add attribute to a post type
 */
export async function addPostTypeAttribute(
  id: string,
  data: AddAttributeDto
): Promise<ApiResponse<PostType>> {
  try {
    const service = await getPostTypeService();
    const response = await service.addAttribute(id, data);
    return response;
  } catch (error) {
    console.error('Add attribute error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add attribute',
      message: 'Add failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update attribute of a post type
 */
export async function updatePostTypeAttribute(
  id: string,
  data: UpdateAttributeDto
): Promise<ApiResponse<PostType>> {
  try {
    const service = await getPostTypeService();
    const response = await service.updateAttribute(id, data);
    return response;
  } catch (error) {
    console.error('Update attribute error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update attribute',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Remove attribute from a post type
 */
export async function removePostTypeAttribute(
  id: string,
  data: RemoveAttributeDto
): Promise<ApiResponse<PostType>> {
  try {
    const service = await getPostTypeService();
    const response = await service.removeAttribute(id, data);
    return response;
  } catch (error) {
    console.error('Remove attribute error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove attribute',
      message: 'Remove failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Reorder attributes of a post type
 */
export async function reorderPostTypeAttributes(
  id: string,
  data: ReorderAttributesDto
): Promise<ApiResponse<PostType>> {
  try {
    const service = await getPostTypeService();
    const response = await service.reorderAttributes(id, data);
    return response;
  } catch (error) {
    console.error('Reorder attributes error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder attributes',
      message: 'Reorder failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Restore a deleted post type
 */
export async function restorePostType(
  id: string
): Promise<ApiResponse<PostType>> {
  try {
    const service = await getPostTypeService();
    const response = await service.restore(id);
    return response;
  } catch (error) {
    console.error('Restore post type error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore post type',
      message: 'Restore failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}
