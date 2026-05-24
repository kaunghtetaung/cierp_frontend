/**
 * Access Policy HTTP Service
 *
 * Wraps the `/access-policies` endpoints on the core service. The
 * backend gates every endpoint to systemAdmin via `ensureSystemAdmin`,
 * and the server actions wrapping this service ALSO check the role
 * before instantiating — defence in depth.
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type {
  ApiResponse,
  AccessPolicy,
  CreateAccessPolicyDto,
  UpdateAccessPolicyDto,
} from './types';

const BASE = '/access-policies';

export interface AccessPolicyServiceContext {
  tenantId: string;
  userSessionId: string;
  userId: string;
}

export class AccessPolicyService {
  private httpClient;
  private tenantId: string;
  private userSessionId: string;
  private userId: string;

  constructor(apiUrl: string, context: AccessPolicyServiceContext) {
    this.httpClient = getCachedServerHttpClient(apiUrl);
    this.tenantId = context.tenantId;
    this.userSessionId = context.userSessionId;
    this.userId = context.userId;
  }

  private auth() {
    return {
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
      tokenStrategy: 'auto' as const,
    };
  }

  async getAll(params?: {
    serviceName?: string;
    moduleName?: string;
    organizationId?: string;
  }): Promise<ApiResponse<AccessPolicy[]>> {
    const qs = new URLSearchParams();
    if (params?.serviceName) qs.set('serviceName', params.serviceName);
    if (params?.moduleName) qs.set('moduleName', params.moduleName);
    if (params?.organizationId)
      qs.set('organizationId', params.organizationId);

    const endpoint = qs.toString() ? `${BASE}?${qs.toString()}` : BASE;
    const response = await this.httpClient.request<AccessPolicy[]>(endpoint, {
      method: 'GET',
      ...this.auth(),
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch access policies');
    }
    return response;
  }

  async getById(id: string): Promise<ApiResponse<AccessPolicy>> {
    const response = await this.httpClient.request<AccessPolicy>(
      `${BASE}/${id}`,
      { method: 'GET', ...this.auth() },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch access policy');
    }
    return response;
  }

  async getByModuleName(
    moduleName: string,
  ): Promise<ApiResponse<AccessPolicy>> {
    const response = await this.httpClient.request<AccessPolicy>(
      `${BASE}/module/${moduleName}`,
      { method: 'GET', ...this.auth() },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch access policy');
    }
    return response;
  }

  async create(
    data: CreateAccessPolicyDto,
  ): Promise<ApiResponse<AccessPolicy>> {
    const response = await this.httpClient.request<AccessPolicy>(BASE, {
      method: 'POST',
      body: data,
      ...this.auth(),
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to create access policy');
    }
    return response;
  }

  async update(
    id: string,
    data: UpdateAccessPolicyDto,
  ): Promise<ApiResponse<AccessPolicy>> {
    const response = await this.httpClient.request<AccessPolicy>(
      `${BASE}/${id}`,
      { method: 'PUT', body: data, ...this.auth() },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to update access policy');
    }
    return response;
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(`${BASE}/${id}`, {
      method: 'DELETE',
      ...this.auth(),
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete access policy');
    }
    return response;
  }

  async restore(id: string): Promise<ApiResponse<AccessPolicy>> {
    const response = await this.httpClient.request<AccessPolicy>(
      `${BASE}/${id}/restore`,
      { method: 'POST', ...this.auth() },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to restore access policy');
    }
    return response;
  }

  /**
   * DANGEROUS — drops all DB policies for the service so the backend
   * re-seeds from `moduleAccessPolicy.json` on next restart.
   */
  async syncFromFile(serviceName?: string): Promise<
    ApiResponse<{ deleted: number; message: string; note: string }>
  > {
    const response = await this.httpClient.request<{
      deleted: number;
      message: string;
      note: string;
    }>(`${BASE}/sync-from-file`, {
      method: 'POST',
      body: serviceName ? { serviceName } : {},
      ...this.auth(),
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to sync policies from file');
    }
    return response;
  }

  /** Invalidate Redis cache so the next request reloads policies. */
  async invalidateCache(serviceName: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${BASE}/invalidate-cache`,
      { method: 'POST', body: { serviceName }, ...this.auth() },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to invalidate cache');
    }
    return response;
  }
}
