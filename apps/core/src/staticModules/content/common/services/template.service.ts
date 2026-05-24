/**
 * Template Service
 * HTTP client wrapper for the `/content/templates` API. Mirrors the
 * Section service pattern (httpClient.request with tenant context +
 * auth wiring). Template stores a layout tree authored by
 * PageLayoutBuilder; this service is purely a transport layer.
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type { ApiResponse } from '@repo/types';
import type {
  Template,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateQuery,
  TemplateListResponse,
  TemplateRefItem,
} from '../types';

const TEMPLATE_BASE = '/content/templates';

export class TemplateService {
  private httpClient;
  private baseURL: string;
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
    this.baseURL = baseURL;
    this.httpClient = getCachedServerHttpClient(baseURL);
    this.tenantId = options?.tenantId;
    this.userSessionId = options?.userSessionId;
    this.userId = options?.userId;
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

  async create(data: CreateTemplateDto): Promise<ApiResponse<Template>> {
    const response = await this.httpClient.request<Template>(TEMPLATE_BASE, {
      method: 'POST',
      body: data,
      ...this.auth(),
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to create template');
    }
    return response;
  }

  async getAll(
    params?: TemplateQuery,
  ): Promise<ApiResponse<TemplateListResponse>> {
    let endpoint = TEMPLATE_BASE;
    const qs = new URLSearchParams();
    if (params) {
      if (params.search) qs.set('search', params.search);
      if (params.status) qs.set('status', params.status);
      if (params.category) qs.set('category', params.category);
      if (params.departmentId) qs.set('departmentId', params.departmentId);
      if (params.page !== undefined) qs.set('page', String(params.page));
      if (params.limit !== undefined) qs.set('limit', String(params.limit));
      if (params.sortBy) qs.set('sortBy', params.sortBy);
      if (params.sortOrder) qs.set('sortOrder', params.sortOrder);
    }
    if (qs.toString()) endpoint += `?${qs.toString()}`;

    const response = await this.httpClient.request<TemplateListResponse>(
      endpoint,
      { method: 'GET', ...this.auth(), timeout: 25000 },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch templates');
    }
    return response;
  }

  /**
   * Lightweight reference list — used by the Page form's template
   * dropdown so we don't ship full layout trees just to populate a
   * select.
   */
  async getReference(): Promise<ApiResponse<TemplateRefItem[]>> {
    const response = await this.httpClient.request<TemplateRefItem[]>(
      `${TEMPLATE_BASE}/ref`,
      { method: 'GET', ...this.auth() },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch template references');
    }
    return response;
  }

  async getById(id: string): Promise<ApiResponse<Template>> {
    const response = await this.httpClient.request<Template>(
      `${TEMPLATE_BASE}/${id}`,
      { method: 'GET', ...this.auth() },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch template');
    }
    return response;
  }

  async update(
    id: string,
    data: UpdateTemplateDto,
  ): Promise<ApiResponse<Template>> {
    const response = await this.httpClient.request<Template>(
      `${TEMPLATE_BASE}/${id}`,
      { method: 'PATCH', body: data, ...this.auth() },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to update template');
    }
    return response;
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${TEMPLATE_BASE}/${id}`,
      { method: 'DELETE', ...this.auth() },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete template');
    }
    return response;
  }

  async hardDelete(id: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.request<void>(
      `${TEMPLATE_BASE}/hard/${id}`,
      { method: 'DELETE', ...this.auth() },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to permanently delete template');
    }
    return response;
  }

  async getDeleted(
    page: number = 1,
    limit: number = 10,
  ): Promise<ApiResponse<TemplateListResponse>> {
    const response = await this.httpClient.request<TemplateListResponse>(
      `${TEMPLATE_BASE}/deleted?page=${page}&limit=${limit}`,
      { method: 'GET', ...this.auth() },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch deleted templates');
    }
    return response;
  }

  async getDeletedCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await this.httpClient.request<{ count: number }>(
      `${TEMPLATE_BASE}/deleted/count`,
      { method: 'GET', ...this.auth() },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch deleted count');
    }
    return response;
  }

  async restore(id: string): Promise<ApiResponse<Template>> {
    const response = await this.httpClient.request<Template>(
      `${TEMPLATE_BASE}/restore/${id}`,
      { method: 'PATCH', ...this.auth() },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to restore template');
    }
    return response;
  }
}
