/**
 * Module Schema Service
 * Service layer for module-schemas API interactions
 * Uses the same authentication infrastructure as dynamic modules
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type {
  ModuleSchema,
  CreateModuleSchemaDto,
  UpdateModuleSchemaDto,
  ApiResponse,
  ModuleSchemaListResponse,
} from './types';

export interface SchemaServiceContext {
  tenantId: string;
  userSessionId: string;
  userId: string;
}

export class ModuleSchemaService {
  private httpClient;
  private tenantId: string;
  private userSessionId: string;
  private userId: string;

  constructor(apiUrl: string, context: SchemaServiceContext) {
    // Use the same cached HTTP client as dynamic modules
    // This ensures proper token management and authentication
    this.httpClient = getCachedServerHttpClient(apiUrl);
    this.tenantId = context.tenantId;
    this.userSessionId = context.userSessionId;
    this.userId = context.userId;

    console.log('📡 [ModuleSchemaService] Initialized with context:', {
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      apiUrl,
    });
  }

  /**
   * Get all module schemas
   */
  async getAll(params?: {
    serviceName?: string;
    organizationId?: string;
  }): Promise<ApiResponse<ModuleSchemaListResponse>> {
    try {
      let endpoint = '/module-schemas';

      const queryParams = new URLSearchParams();
      if (params?.serviceName) queryParams.append('serviceName', params.serviceName);
      if (params?.organizationId) queryParams.append('organizationId', params.organizationId);

      if (queryParams.toString()) {
        endpoint += `?${queryParams.toString()}`;
      }

      console.log('📡 [ModuleSchemaService.getAll] Making request with:', {
        endpoint,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
      });

      const response = await this.httpClient.request<ModuleSchema[]>(endpoint, {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
        timeout: 25000,
      });

      console.log('📡 [ModuleSchemaService.getAll] Response:', {
        success: response.success,
        error: response.error,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
      });

      if (!response.success) {
        return {
          success: false,
          data: { data: [], total: 0 },
          error: response.error || 'Failed to fetch schemas',
          timestamp: new Date(),
        };
      }

      // Handle response format - could be array or object with data property
      const responseData = response.data;
      const schemas = Array.isArray(responseData) ? responseData : (responseData as any)?.data || [];

      return {
        success: true,
        data: { data: schemas, total: schemas.length },
        message: 'Success',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('ModuleSchemaService.getAll error:', error);
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
  async getById(id: string): Promise<ApiResponse<ModuleSchema>> {
    try {
      const response = await this.httpClient.request<ModuleSchema>(`/module-schemas/${id}`, {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      });

      if (!response.success) {
        return {
          success: false,
          data: null as any,
          error: response.error || 'Failed to fetch schema',
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data: response.data,
        message: 'Success',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('ModuleSchemaService.getById error:', error);
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
  async getBySlug(
    slug: string,
    serviceName: string,
    organizationId?: string
  ): Promise<ApiResponse<ModuleSchema>> {
    try {
      const queryParams = new URLSearchParams({ serviceName });
      if (organizationId) queryParams.append('organizationId', organizationId);

      const response = await this.httpClient.request<ModuleSchema>(
        `/module-schemas/slug/${slug}?${queryParams.toString()}`,
        {
          method: 'GET',
          tenantId: this.tenantId,
          userSessionId: this.userSessionId,
          userId: this.userId,
          withAuth: true,
          tokenStrategy: 'auto',
        }
      );

      if (!response.success) {
        return {
          success: false,
          data: null as any,
          error: response.error || 'Failed to fetch schema',
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data: response.data,
        message: 'Success',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('ModuleSchemaService.getBySlug error:', error);
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
  async getByService(
    serviceName: string,
    organizationId?: string
  ): Promise<ApiResponse<ModuleSchemaListResponse>> {
    try {
      let endpoint = `/module-schemas/service/${serviceName}`;
      if (organizationId) {
        endpoint += `?organizationId=${organizationId}`;
      }

      const response = await this.httpClient.request<ModuleSchema[]>(endpoint, {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      });

      if (!response.success) {
        return {
          success: false,
          data: { data: [], total: 0 },
          error: response.error || 'Failed to fetch schemas',
          timestamp: new Date(),
        };
      }

      const schemas = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: { data: schemas, total: schemas.length },
        message: 'Success',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('ModuleSchemaService.getByService error:', error);
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
  async create(data: CreateModuleSchemaDto): Promise<ApiResponse<ModuleSchema>> {
    try {
      const response = await this.httpClient.request<ModuleSchema>('/module-schemas', {
        method: 'POST',
        body: data,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      });

      if (!response.success) {
        return {
          success: false,
          data: null as any,
          error: response.error || 'Failed to create schema',
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data: response.data,
        message: 'Success',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('ModuleSchemaService.create error:', error);
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
  async update(
    id: string,
    data: UpdateModuleSchemaDto
  ): Promise<ApiResponse<ModuleSchema>> {
    try {
      const response = await this.httpClient.request<ModuleSchema>(`/module-schemas/${id}`, {
        method: 'PUT',
        body: data,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      });

      if (!response.success) {
        return {
          success: false,
          data: null as any,
          error: response.error || 'Failed to update schema',
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data: response.data,
        message: 'Success',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('ModuleSchemaService.update error:', error);
      return {
        success: false,
        data: null as any,
        error: error instanceof Error ? error.message : 'Failed to update schema',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Soft delete a module schema
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.httpClient.request<void>(`/module-schemas/${id}`, {
        method: 'DELETE',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      });

      if (!response.success) {
        return {
          success: false,
          data: null as any,
          error: response.error || 'Failed to delete schema',
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data: undefined as any,
        message: 'Schema deleted successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('ModuleSchemaService.delete error:', error);
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
  async restore(id: string): Promise<ApiResponse<ModuleSchema>> {
    try {
      const response = await this.httpClient.request<ModuleSchema>(`/module-schemas/${id}/restore`, {
        method: 'POST',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      });

      if (!response.success) {
        return {
          success: false,
          data: null as any,
          error: response.error || 'Failed to restore schema',
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data: response.data,
        message: 'Success',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('ModuleSchemaService.restore error:', error);
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
  async validate(data: CreateModuleSchemaDto): Promise<ApiResponse<{ valid: boolean; message: string }>> {
    try {
      const response = await this.httpClient.request<{ valid: boolean; message: string }>(
        '/module-schemas/validate',
        {
          method: 'POST',
          body: data,
          tenantId: this.tenantId,
          userSessionId: this.userSessionId,
          userId: this.userId,
          withAuth: true,
          tokenStrategy: 'auto',
        }
      );

      if (!response.success) {
        return {
          success: false,
          data: { valid: false, message: 'Validation failed' },
          error: response.error || 'Failed to validate schema',
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data: response.data,
        message: 'Success',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('ModuleSchemaService.validate error:', error);
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
  async invalidateCache(
    serviceName: string,
    organizationId?: string
  ): Promise<ApiResponse<void>> {
    try {
      const response = await this.httpClient.request<void>('/module-schemas/invalidate-cache', {
        method: 'POST',
        body: { serviceName, organizationId },
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      });

      if (!response.success) {
        return {
          success: false,
          data: null as any,
          error: response.error || 'Failed to invalidate cache',
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data: undefined as any,
        message: 'Cache invalidated successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('ModuleSchemaService.invalidateCache error:', error);
      return {
        success: false,
        data: null as any,
        error: error instanceof Error ? error.message : 'Failed to invalidate cache',
        timestamp: new Date(),
      };
    }
  }
}
