/**
 * Post Server Actions
 * Next.js 15 Server Actions for post management
 */

'use server';

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { PostService } from '../services/post.service';
import type { ApiResponse } from '@repo/types';
import type {
  Post,
  PostRevision,
  CreatePostDto,
  UpdatePostDto,
  PostQuery,
  PostSearchQuery,
  PostSearchResult,
  RelatedPostsQuery,
  PostStatistics,
  BulkPostOperation,
  PostListResponse,
  PostSearchResponse,
} from '../types';

/**
 * Get post service instance with proper context
 */
async function getPostService(): Promise<PostService> {
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

  return new PostService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

/**
 * Create a new post
 */
export async function createPost(
  data: CreatePostDto
): Promise<ApiResponse<Post>> {
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

    if (!data.postTypeId) {
      return {
        success: false,
        error: 'Post type is required',
        message: 'Validation failed',
        data: null as any,
        timestamp: new Date(),
      };
    }

    const service = await getPostService();
    const response = await service.create(data);
    return response;
  } catch (error) {
    console.error('Create post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create post',
      message: 'Create failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get posts list
 */
export async function getPosts(
  params?: PostQuery
): Promise<ApiResponse<PostListResponse>> {
  try {
    const service = await getPostService();
    const response = await service.getAll(params);
    return response;
  } catch (error) {
    console.error('Get posts error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch posts',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get post by ID
 */
export async function getPostById(
  id: string
): Promise<ApiResponse<Post>> {
  try {
    const service = await getPostService();
    const response = await service.getById(id);
    return response;
  } catch (error) {
    console.error('Get post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch post',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get post by slug
 */
export async function getPostBySlug(
  slug: string
): Promise<ApiResponse<Post>> {
  try {
    const service = await getPostService();
    const response = await service.getBySlug(slug);
    return response;
  } catch (error) {
    console.error('Get post by slug error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch post',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update a post
 */
export async function updatePost(
  id: string,
  data: UpdatePostDto
): Promise<ApiResponse<Post>> {
  try {
    const service = await getPostService();
    const response = await service.update(id, data);
    return response;
  } catch (error) {
    console.error('Update post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update post',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Delete a post
 */
export async function deletePost(
  id: string
): Promise<ApiResponse<void>> {
  try {
    const service = await getPostService();
    const response = await service.delete(id);
    return response;
  } catch (error) {
    console.error('Delete post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete post',
      message: 'Delete failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Publish a post
 */
export async function publishPost(
  id: string
): Promise<ApiResponse<Post>> {
  try {
    const service = await getPostService();
    const response = await service.publish(id);
    return response;
  } catch (error) {
    console.error('Publish post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish post',
      message: 'Publish failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Unpublish a post
 */
export async function unpublishPost(
  id: string
): Promise<ApiResponse<Post>> {
  try {
    const service = await getPostService();
    const response = await service.unpublish(id);
    return response;
  } catch (error) {
    console.error('Unpublish post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unpublish post',
      message: 'Unpublish failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Schedule a post
 */
export async function schedulePost(
  id: string,
  scheduledAt: string
): Promise<ApiResponse<Post>> {
  try {
    const service = await getPostService();
    const response = await service.schedule(id, scheduledAt);
    return response;
  } catch (error) {
    console.error('Schedule post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to schedule post',
      message: 'Schedule failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Archive a post
 */
export async function archivePost(
  id: string
): Promise<ApiResponse<Post>> {
  try {
    const service = await getPostService();
    const response = await service.archive(id);
    return response;
  } catch (error) {
    console.error('Archive post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to archive post',
      message: 'Archive failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Search posts
 */
export async function searchPosts(
  params: PostSearchQuery
): Promise<ApiResponse<PostSearchResponse>> {
  try {
    const service = await getPostService();
    const response = await service.search(params);
    return response;
  } catch (error) {
    console.error('Search posts error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search posts',
      message: 'Search failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get related posts
 */
export async function getRelatedPosts(
  params: RelatedPostsQuery
): Promise<ApiResponse<Post[]>> {
  try {
    const service = await getPostService();
    const response = await service.getRelated(params);
    return response;
  } catch (error) {
    console.error('Get related posts error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch related posts',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get post statistics
 */
export async function getPostStatistics(
  departmentId?: string
): Promise<ApiResponse<PostStatistics>> {
  try {
    const service = await getPostService();
    const response = await service.getStatistics(departmentId);
    return response;
  } catch (error) {
    console.error('Get post statistics error:', error);
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
 * Get post revisions
 */
export async function getPostRevisions(
  postId: string
): Promise<ApiResponse<PostRevision[]>> {
  try {
    const service = await getPostService();
    const response = await service.getRevisions(postId);
    return response;
  } catch (error) {
    console.error('Get post revisions error:', error);
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
 * Restore post to revision
 */
export async function restorePostRevision(
  postId: string,
  revisionId: string
): Promise<ApiResponse<Post>> {
  try {
    const service = await getPostService();
    const response = await service.restoreRevision(postId, revisionId);
    return response;
  } catch (error) {
    console.error('Restore post revision error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore revision',
      message: 'Restore failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Bulk post operation
 */
export async function bulkPostOperation(
  data: BulkPostOperation
): Promise<ApiResponse<{ affected: number }>> {
  try {
    const service = await getPostService();
    const response = await service.bulkOperation(data);
    return response;
  } catch (error) {
    console.error('Bulk post operation error:', error);
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
 * Restore a deleted post
 */
export async function restorePost(
  id: string
): Promise<ApiResponse<Post>> {
  try {
    const service = await getPostService();
    const response = await service.restore(id);
    return response;
  } catch (error) {
    console.error('Restore post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore post',
      message: 'Restore failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}
