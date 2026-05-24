/**
 * Tag Server Actions
 * Next.js 15 Server Actions for tag management
 */

'use server';

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { TagService } from '../services/tag.service';
import type { ApiResponse } from '@repo/types';
import type {
  Tag,
  CreateTagDto,
  UpdateTagDto,
  TagQuery,
  TagAutocompleteQuery,
  TagSuggestion,
  MergeTagsDto,
  TagListResponse,
} from '../types';

/**
 * Get tag service instance with proper context
 */
async function getTagService(): Promise<TagService> {
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

  return new TagService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

/**
 * Create a new tag
 */
export async function createTag(
  data: CreateTagDto
): Promise<ApiResponse<Tag>> {
  try {
    // Backend DTO is `name: string`. Accept either a string or a multilang
    // object and normalize to a string.
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
    const service = await getTagService();
    const response = await service.create(payload);
    return response;
  } catch (error) {
    console.error('Create tag error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create tag',
      message: 'Create failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Lightweight reference lookup for dropdowns — `{ id, label, value }` items.
 * Goes Next.js (server-side, with auth token) → API gateway → content
 * service `/tags/ref`.
 */
export async function getTagReference(
  params?: { search?: string; limit?: number; status?: string }
): Promise<
  ApiResponse<Array<{ id: string; label: string; value: string }>>
> {
  try {
    const service = await getTagService();
    const response = await service.getReference(params);
    if (response.success && response.data) {
      // The shared StandardResponseHandler unwraps `body.data` automatically,
      // so `response.data` is already the array.
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
      error: response.error || 'Failed to fetch tag reference',
      message: 'Fetch failed',
      data: [] as any,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Get tag reference error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tag reference',
      message: 'Fetch failed',
      data: [] as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get tags list
 */
export async function getTags(
  params?: TagQuery
): Promise<ApiResponse<TagListResponse>> {
  try {
    const service = await getTagService();
    const response = await service.getAll(params);
    return response;
  } catch (error) {
    console.error('Get tags error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tags',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get tag by ID
 */
export async function getTagById(
  id: string
): Promise<ApiResponse<Tag>> {
  try {
    const service = await getTagService();
    const response = await service.getById(id);
    return response;
  } catch (error) {
    console.error('Get tag error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tag',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update a tag
 */
export async function updateTag(
  id: string,
  data: UpdateTagDto
): Promise<ApiResponse<Tag>> {
  try {
    const service = await getTagService();
    const response = await service.update(id, data);
    return response;
  } catch (error) {
    console.error('Update tag error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update tag',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Delete a tag
 */
export async function deleteTag(
  id: string
): Promise<ApiResponse<void>> {
  try {
    const service = await getTagService();
    const response = await service.delete(id);
    return response;
  } catch (error) {
    console.error('Delete tag error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete tag',
      message: 'Delete failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Autocomplete tags
 */
export async function autocompleteTags(
  params: TagAutocompleteQuery
): Promise<ApiResponse<TagSuggestion[]>> {
  try {
    const service = await getTagService();
    const response = await service.autocomplete(params);
    return response;
  } catch (error) {
    console.error('Autocomplete tags error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tag suggestions',
      message: 'Autocomplete failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get popular tags
 */
export async function getPopularTags(
  limit: number = 10,
  departmentId?: string
): Promise<ApiResponse<Tag[]>> {
  try {
    const service = await getTagService();
    const response = await service.getPopular(limit, departmentId);
    return response;
  } catch (error) {
    console.error('Get popular tags error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch popular tags',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Merge tags
 */
export async function mergeTags(
  data: MergeTagsDto
): Promise<ApiResponse<Tag>> {
  try {
    const service = await getTagService();
    const response = await service.merge(data);
    return response;
  } catch (error) {
    console.error('Merge tags error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to merge tags',
      message: 'Merge failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Restore a deleted tag
 */
export async function restoreTag(
  id: string
): Promise<ApiResponse<Tag>> {
  try {
    const service = await getTagService();
    const response = await service.restore(id);
    return response;
  } catch (error) {
    console.error('Restore tag error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore tag',
      message: 'Restore failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}
