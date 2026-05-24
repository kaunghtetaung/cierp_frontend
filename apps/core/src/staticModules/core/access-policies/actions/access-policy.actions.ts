/**
 * Access Policy Server Actions — SystemAdmin only.
 *
 * Every action here checks the caller's role before instantiating the
 * service. The backend ALSO gates each endpoint via
 * `ensureSystemAdmin(req)` — defence in depth.
 */

'use server';

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { AccessPolicyService } from '../lib/access-policy.service';
import type {
  ApiResponse,
  AccessPolicy,
  CreateAccessPolicyDto,
  UpdateAccessPolicyDto,
} from '../lib/types';

/**
 * Mirrors the schema-editor's role check. Reads the role from the
 * session user — the JWT roles array is the source of truth and is
 * also what the backend reads.
 */
function isSystemAdmin(user: any): boolean {
  if (!user?.roles || user.roles.length === 0) return false;
  const roleInfo = user.roles[0];
  if (typeof roleInfo === 'string') {
    return roleInfo.toLowerCase() === 'systemadmin';
  }
  if (typeof roleInfo === 'object' && roleInfo !== null) {
    if ('Role' in roleInfo && roleInfo.Role) {
      return roleInfo.Role.toLowerCase() === 'systemadmin';
    }
    if (
      'roles' in roleInfo &&
      Array.isArray(roleInfo.roles) &&
      roleInfo.roles.length > 0
    ) {
      return roleInfo.roles[0].toLowerCase() === 'systemadmin';
    }
  }
  return false;
}

async function getService(): Promise<AccessPolicyService> {
  const headerStore = await headers();
  const [user, session] = await Promise.all([
    getCurrentUser(headerStore),
    getCurrentSession(headerStore),
  ]);
  if (!user || !session) {
    throw new Error('Authentication required');
  }
  if (!isSystemAdmin(user)) {
    throw new Error('Access denied: SystemAdmin role required');
  }
  const tenantId =
    headerStore.get('x-tenant-id') || user.tenantId || session.tenantId;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  const apiUrl = await getApiDomain();
  return new AccessPolicyService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

function failure(message: string, error?: unknown): ApiResponse<any> {
  return {
    success: false,
    error: error instanceof Error ? error.message : message,
    message,
    data: null as any,
    timestamp: new Date(),
  };
}

/**
 * Lightweight current-user role check exposed to client components so
 * the page can render an "Access denied" UI without making an API
 * call. Mirrors the schema-editor pattern.
 */
export async function checkSystemAdminAccess(): Promise<{
  isSystemAdmin: boolean;
  user: any;
}> {
  try {
    const headerStore = await headers();
    const user = await getCurrentUser(headerStore);
    return { isSystemAdmin: isSystemAdmin(user), user };
  } catch {
    return { isSystemAdmin: false, user: null };
  }
}

export async function getAccessPolicies(params?: {
  serviceName?: string;
  moduleName?: string;
}): Promise<ApiResponse<AccessPolicy[]>> {
  try {
    const service = await getService();
    return await service.getAll(params);
  } catch (error) {
    console.error('Get access policies error:', error);
    return failure('Failed to fetch access policies', error);
  }
}

export async function getAccessPolicyById(
  id: string,
): Promise<ApiResponse<AccessPolicy>> {
  try {
    const service = await getService();
    return await service.getById(id);
  } catch (error) {
    console.error('Get access policy error:', error);
    return failure('Failed to fetch access policy', error);
  }
}

export async function createAccessPolicy(
  data: CreateAccessPolicyDto,
): Promise<ApiResponse<AccessPolicy>> {
  try {
    const service = await getService();
    return await service.create(data);
  } catch (error) {
    console.error('Create access policy error:', error);
    return failure('Failed to create access policy', error);
  }
}

export async function updateAccessPolicy(
  id: string,
  data: UpdateAccessPolicyDto,
): Promise<ApiResponse<AccessPolicy>> {
  try {
    const service = await getService();
    return await service.update(id, data);
  } catch (error) {
    console.error('Update access policy error:', error);
    return failure('Failed to update access policy', error);
  }
}

export async function deleteAccessPolicy(
  id: string,
): Promise<ApiResponse<void>> {
  try {
    const service = await getService();
    return await service.delete(id);
  } catch (error) {
    console.error('Delete access policy error:', error);
    return failure('Failed to delete access policy', error);
  }
}

export async function restoreAccessPolicy(
  id: string,
): Promise<ApiResponse<AccessPolicy>> {
  try {
    const service = await getService();
    return await service.restore(id);
  } catch (error) {
    console.error('Restore access policy error:', error);
    return failure('Failed to restore access policy', error);
  }
}

export async function syncPoliciesFromFile(
  serviceName?: string,
): Promise<ApiResponse<{ deleted: number; message: string; note: string }>> {
  try {
    const service = await getService();
    return await service.syncFromFile(serviceName);
  } catch (error) {
    console.error('Sync from file error:', error);
    return failure('Failed to sync policies from file', error);
  }
}

export async function invalidateAccessPolicyCache(
  serviceName: string,
): Promise<ApiResponse<void>> {
  try {
    const service = await getService();
    return await service.invalidateCache(serviceName);
  } catch (error) {
    console.error('Invalidate cache error:', error);
    return failure('Failed to invalidate cache', error);
  }
}
