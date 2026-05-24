/**
 * Department Server Actions (post-module-scoped)
 *
 * Limited surface — currently exposes the `/publishable` lookup used by
 * the post form. Other department CRUD goes through `getModuleReference`
 * elsewhere in the app.
 */

'use server';

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { DepartmentService } from '../services/department.service';
import type { ApiResponse } from '@repo/types';

async function getDepartmentService(): Promise<DepartmentService> {
  const headerStore = await headers();
  const [user, session] = await Promise.all([
    getCurrentUser(headerStore),
    getCurrentSession(headerStore),
  ]);

  if (!user || !session) {
    throw new Error('Authentication required');
  }

  const tenantId =
    headerStore.get('x-tenant-id') || user.tenantId || session.tenantId;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }

  const apiUrl = await getApiDomain();
  return new DepartmentService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

/**
 * Shape returned to the form: the canonical department list plus a
 * `canPublishOrgLevel` flag that's true iff the requester carries a
 * systemAdmin / organizationAdmin role for this org. The flag drives
 * the post form's "Organization-level (no department)" toggle.
 */
export interface PublishableDepartmentsResult {
  items: Array<{ id: string; label: string; value: string }>;
  canPublishOrgLevel: boolean;
}

/**
 * Departments where the current user has the `publish` operation for the
 * given content module (default: `post`). Returns canonical
 * `{ id, label, value }` items. Empty list ⇒ user has no publish rights
 * anywhere; the form should be disabled in that case.
 */
export async function getPublishableDepartments(params?: {
  module?: string;
  service?: string;
}): Promise<ApiResponse<PublishableDepartmentsResult>> {
  try {
    const service = await getDepartmentService();
    const response = await service.getPublishable(params);
    if (response.success && response.data) {
      // The shared StandardResponseHandler unwraps the API envelope to
      // `response.data` — which is the new `{ items, canPublishOrgLevel }`
      // shape. Older deployments still return a bare array; handle both.
      const raw: any = response.data;
      const items: Array<{ id: string; label: string; value: string }> =
        Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
            ? raw.items
            : Array.isArray(raw?.data)
              ? raw.data
              : [];
      const canPublishOrgLevel: boolean = Boolean(
        typeof raw === 'object' && !Array.isArray(raw) && raw.canPublishOrgLevel,
      );
      return {
        success: true,
        data: { items, canPublishOrgLevel },
        message: 'OK',
        timestamp: new Date(),
      } as ApiResponse<PublishableDepartmentsResult>;
    }
    return {
      success: false,
      error: response.error || 'Failed to fetch publishable departments',
      message: 'Fetch failed',
      data: { items: [], canPublishOrgLevel: false },
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Get publishable departments error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch publishable departments',
      message: 'Fetch failed',
      data: { items: [], canPublishOrgLevel: false },
      timestamp: new Date(),
    };
  }
}
