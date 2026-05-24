/**
 * Module Schema Server Actions
 * Next.js 15 Server Actions for module schema management
 * SystemAdmin only
 */

'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { ModuleSchemaService } from '../lib/schema.service';
import type {
  ModuleSchema,
  CreateModuleSchemaDto,
  UpdateModuleSchemaDto,
  ApiResponse,
  ModuleSchemaListResponse,
} from '../lib/types';

/**
 * Check if user has SystemAdmin role
 */
function isSystemAdmin(user: any): boolean {
  if (!user?.roles || user.roles.length === 0) {
    return false;
  }

  const roleInfo = user.roles[0];

  if (typeof roleInfo === 'string') {
    return roleInfo.toLowerCase() === 'systemadmin';
  }

  if (typeof roleInfo === 'object' && roleInfo !== null) {
    if ('Role' in roleInfo && roleInfo.Role) {
      return roleInfo.Role.toLowerCase() === 'systemadmin';
    }
    if ('roles' in roleInfo && Array.isArray(roleInfo.roles) && roleInfo.roles.length > 0) {
      return roleInfo.roles[0].toLowerCase() === 'systemadmin';
    }
  }

  return false;
}

/**
 * Get schema service instance with proper context
 * Only SystemAdmin can access this service
 */
async function getSchemaService(): Promise<ModuleSchemaService> {
  const headerStore = await headers();
  const [user, session] = await Promise.all([
    getCurrentUser(headerStore),
    getCurrentSession(headerStore),
  ]);

  if (!user || !session) {
    throw new Error('Authentication required');
  }

  // Check SystemAdmin role
  if (!isSystemAdmin(user)) {
    throw new Error('Access denied: SystemAdmin role required');
  }

  const tenantId = headerStore.get('x-tenant-id') || user.tenantId || session.tenantId;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }

  const apiUrl = await getApiDomain();

  return new ModuleSchemaService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

/**
 * Check current user SystemAdmin status
 */
export async function checkSystemAdminAccess(): Promise<{
  isAdmin: boolean;
  user: any | null;
  error?: string;
}> {
  try {
    const headerStore = await headers();
    const user = await getCurrentUser(headerStore);

    if (!user) {
      return { isAdmin: false, user: null, error: 'Not authenticated' };
    }

    return {
      isAdmin: isSystemAdmin(user),
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    };
  } catch (error) {
    console.error('checkSystemAdminAccess error:', error);
    return {
      isAdmin: false,
      user: null,
      error: error instanceof Error ? error.message : 'Failed to check access',
    };
  }
}

/**
 * Get all module schemas
 */
export async function getModuleSchemas(params?: {
  serviceName?: string;
  organizationId?: string;
}): Promise<ApiResponse<ModuleSchemaListResponse>> {
  try {
    const service = await getSchemaService();
    return await service.getAll(params);
  } catch (error) {
    console.error('getModuleSchemas error:', error);
    return {
      success: false,
      data: { data: [], total: 0 },
      error: error instanceof Error ? error.message : 'Failed to fetch schemas',
      timestamp: new Date(),
    };
  }
}

/**
 * Get module schema by ID
 */
export async function getModuleSchemaById(
  id: string
): Promise<ApiResponse<ModuleSchema>> {
  try {
    const service = await getSchemaService();
    return await service.getById(id);
  } catch (error) {
    console.error('getModuleSchemaById error:', error);
    return {
      success: false,
      data: null as any,
      error: error instanceof Error ? error.message : 'Failed to fetch schema',
      timestamp: new Date(),
    };
  }
}

/**
 * Get module schema by slug
 */
export async function getModuleSchemaBySlug(
  slug: string,
  serviceName: string,
  organizationId?: string
): Promise<ApiResponse<ModuleSchema>> {
  try {
    const service = await getSchemaService();
    return await service.getBySlug(slug, serviceName, organizationId);
  } catch (error) {
    console.error('getModuleSchemaBySlug error:', error);
    return {
      success: false,
      data: null as any,
      error: error instanceof Error ? error.message : 'Failed to fetch schema',
      timestamp: new Date(),
    };
  }
}

/**
 * Get all schemas for a service
 */
export async function getSchemasByService(
  serviceName: string,
  organizationId?: string
): Promise<ApiResponse<ModuleSchemaListResponse>> {
  try {
    const service = await getSchemaService();
    return await service.getByService(serviceName, organizationId);
  } catch (error) {
    console.error('getSchemasByService error:', error);
    return {
      success: false,
      data: { data: [], total: 0 },
      error: error instanceof Error ? error.message : 'Failed to fetch schemas',
      timestamp: new Date(),
    };
  }
}

/**
 * Create a new module schema
 */
export async function createModuleSchema(
  data: CreateModuleSchemaDto
): Promise<ApiResponse<ModuleSchema>> {
  try {
    // Validate required fields
    if (!data.name?.en || !data.name?.mm) {
      return {
        success: false,
        data: null as any,
        error: 'Name is required in both languages',
        timestamp: new Date(),
      };
    }

    if (!data.slug) {
      return {
        success: false,
        data: null as any,
        error: 'Slug is required',
        timestamp: new Date(),
      };
    }

    if (!data.serviceName) {
      return {
        success: false,
        data: null as any,
        error: 'Service name is required',
        timestamp: new Date(),
      };
    }

    const service = await getSchemaService();
    return await service.create(data);
  } catch (error) {
    console.error('createModuleSchema error:', error);
    return {
      success: false,
      data: null as any,
      error: error instanceof Error ? error.message : 'Failed to create schema',
      timestamp: new Date(),
    };
  }
}

/**
 * Update a module schema
 */
export async function updateModuleSchema(
  id: string,
  data: UpdateModuleSchemaDto
): Promise<ApiResponse<ModuleSchema>> {
  try {
    const service = await getSchemaService();
    return await service.update(id, data);
  } catch (error) {
    console.error('updateModuleSchema error:', error);
    return {
      success: false,
      data: null as any,
      error: error instanceof Error ? error.message : 'Failed to update schema',
      timestamp: new Date(),
    };
  }
}

/**
 * Delete a module schema (soft delete)
 */
export async function deleteModuleSchema(
  id: string
): Promise<ApiResponse<void>> {
  try {
    const service = await getSchemaService();
    return await service.delete(id);
  } catch (error) {
    console.error('deleteModuleSchema error:', error);
    return {
      success: false,
      data: null as any,
      error: error instanceof Error ? error.message : 'Failed to delete schema',
      timestamp: new Date(),
    };
  }
}

/**
 * Restore a soft-deleted module schema
 */
export async function restoreModuleSchema(
  id: string
): Promise<ApiResponse<ModuleSchema>> {
  try {
    const service = await getSchemaService();
    return await service.restore(id);
  } catch (error) {
    console.error('restoreModuleSchema error:', error);
    return {
      success: false,
      data: null as any,
      error: error instanceof Error ? error.message : 'Failed to restore schema',
      timestamp: new Date(),
    };
  }
}

/**
 * Validate module schema structure
 */
export async function validateModuleSchema(
  data: CreateModuleSchemaDto
): Promise<ApiResponse<{ valid: boolean; message: string }>> {
  try {
    const service = await getSchemaService();
    return await service.validate(data);
  } catch (error) {
    console.error('validateModuleSchema error:', error);
    return {
      success: false,
      data: { valid: false, message: 'Validation failed' },
      error: error instanceof Error ? error.message : 'Failed to validate schema',
      timestamp: new Date(),
    };
  }
}

/**
 * Invalidate Redis cache for a service
 */
export async function invalidateSchemaCache(
  serviceName: string,
  organizationId?: string
): Promise<ApiResponse<void>> {
  try {
    const service = await getSchemaService();
    return await service.invalidateCache(serviceName, organizationId);
  } catch (error) {
    console.error('invalidateSchemaCache error:', error);
    return {
      success: false,
      data: null as any,
      error: error instanceof Error ? error.message : 'Failed to invalidate cache',
      timestamp: new Date(),
    };
  }
}
