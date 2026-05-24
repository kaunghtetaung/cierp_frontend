/**
 * Department Service (frontend, server-only)
 *
 * Thin wrapper around the core service's `/departments/*` endpoints.
 * Used by post-module pickers that need departments scoped to specific
 * permissions (e.g. `/publishable`).
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type { ApiResponse } from '@repo/types';

// `core` is the backend service that owns the department module.
const DEPARTMENT_BASE = '/core/departments';

export class DepartmentService {
  private httpClient;
  private tenantId?: string;
  private userSessionId?: string;
  private userId?: string;

  constructor(
    baseURL: string,
    options?: {
      tenantId?: string;
      userSessionId?: string;
      userId?: string;
    },
  ) {
    this.httpClient = getCachedServerHttpClient(baseURL);
    this.tenantId = options?.tenantId;
    this.userSessionId = options?.userSessionId;
    this.userId = options?.userId;
  }

  /**
   * Departments where the requester has the `publish` operation for
   * the given module. Backend filters by JWT roles.
   */
  async getPublishable(params?: {
    module?: string;
    service?: string;
  }): Promise<
    ApiResponse<{
      statusCode: number;
      message: string;
      // `data` carries the items array AND the org-level publishing flag.
      // Backend nests them together because the gateway's response
      // handler only forwards `body.data` (sibling fields drop).
      data: {
        items: Array<{ id: string; label: string; value: string }>;
        canPublishOrgLevel: boolean;
      };
      total: number;
    }>
  > {
    const qs = new URLSearchParams();
    if (params?.module) qs.set('module', params.module);
    if (params?.service) qs.set('service', params.service);
    const endpoint = `${DEPARTMENT_BASE}/publishable${
      qs.toString() ? `?${qs}` : ''
    }`;
    const response = await this.httpClient.request<{
      statusCode: number;
      message: string;
      data: {
        items: Array<{ id: string; label: string; value: string }>;
        canPublishOrgLevel: boolean;
      };
      total: number;
    }>(endpoint, {
      method: 'GET',
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
      tokenStrategy: 'auto',
      timeout: 25000,
    });
    if (!response.success) {
      throw new Error(
        response.error || 'Failed to fetch publishable departments',
      );
    }
    return response;
  }
}
