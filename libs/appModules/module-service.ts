import { getCachedServerHttpClient } from "@repo/api/server-only";
import type {
  ModuleListParams,
  BulkOperationParams,
  ExtraActionParams,
} from "./types";

/**
 * Module Service for CRUD operations using libs/api/client
 */
export class ModuleService {
  private httpClient;
  private tenantId?: string;
  private userSessionId?: string;
  private userId?: string;
  private appName: string;

  constructor(
    baseURL: string,
    options?: { 
      tenantId?: string; 
      userSessionId?: string; 
      userId?: string;
      appName?: string;
    }
  ) {
    // Use cached HTTP client to prevent circular dependency issues
    // This ensures the same client instance is reused across all module operations
    this.httpClient = getCachedServerHttpClient(baseURL);
    this.tenantId = options?.tenantId;
    this.userSessionId = options?.userSessionId;
    this.userId = options?.userId;
    this.appName = options?.appName || 'core'; // Default to 'core' for backward compatibility
  }
  /**
   * Fetch module list with pagination and filters
   */
  async getList<T = any>(
    module: string,
    params: ModuleListParams = {}
  ): Promise<T[]> {
    let endpoint = `/${this.appName}/${module}`;

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set("page", String(params.page));
    if (params.limit) queryParams.set("limit", String(params.limit));
    if (params.sort) queryParams.set("sort", params.sort);
    if (params.order) queryParams.set("order", params.order);

    // Add field filters with operators (e.g., filter[name][$regex]=test)
    if (params.filters) {
      Object.entries(params.filters).forEach(([fieldName, operators]) => {
        Object.entries(operators).forEach(([operator, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.set(`filter[${fieldName}][${operator}]`, String(value));
          }
        });
      });
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    const response = await this.httpClient.request<T[]>(endpoint, {
      method: "GET",
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch module list");
    }

    return response.data;
  }

  /**
   * Fetch single module item by ID
   */
  async getItem<T = any>(module: string, id: string): Promise<T> {
    const response = await this.httpClient.request<T>(`/${this.appName}/${module}/${id}`, {
      method: "GET",
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch module item");
    }

    return response.data;
  }

  /**
   * Create new module item
   */
  async create<T = any>(module: string, data: any): Promise<T> {
    const response = await this.httpClient.request<T>(`/${this.appName}/${module}`, {
      method: "POST",
      body: data,
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
    });

    if (!response.success) {
      // Check if this is a structured error with detailed information
      if (response.error && typeof response.error === 'string') {
        try {
          // Try to parse as JSON in case it contains structured error data
          const errorData = JSON.parse(response.error);
          // Preserve the full error structure for ALL structured errors (not just FORM_VALIDATION_FAIL)
          if (errorData.errorCode || errorData.statusCode) {
            console.log("🔍 ModuleService.create: Preserving structured error data:", errorData);
            throw new Error(JSON.stringify(errorData));
          }
        } catch (parseError) {
          // Not JSON, treat as regular error
          console.log("🔍 ModuleService.create: Error is not structured JSON, using plain message");
        }
      }
      throw new Error(response.error || "Failed to create module item");
    }

    return response.data;
  }

  /**
   * Update existing module item
   */
  async update<T = any>(module: string, id: string, data: any): Promise<T> {
    const response = await this.httpClient.request<T>(`/${this.appName}/${module}/${id}`, {
      method: "PATCH",
      body: data,
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
    });

    if (!response.success) {
      // Check if this is a structured error with detailed information
      if (response.error && typeof response.error === 'string') {
        try {
          // Try to parse as JSON in case it contains structured error data
          const errorData = JSON.parse(response.error);
          // Preserve the full error structure for ALL structured errors (not just FORM_VALIDATION_FAIL)
          if (errorData.errorCode || errorData.statusCode) {
            console.log("🔍 ModuleService.update: Preserving structured error data:", errorData);
            throw new Error(JSON.stringify(errorData));
          }
        } catch (parseError) {
          // Not JSON, treat as regular error
          console.log("🔍 ModuleService.update: Error is not structured JSON, using plain message");
        }
      }
      throw new Error(response.error || "Failed to update module item");
    }

    return response.data;
  }

  /**
   * Delete module item
   */
  async delete<T = any>(module: string, id: string): Promise<T> {
    const response = await this.httpClient.request<T>(`/${this.appName}/${module}/${id}`, {
      method: "DELETE",
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to delete module item");
    }

    return response.data;
  }

  /**
   * Bulk operations (delete/hard-delete/restore/update multiple items)
   */
  async bulkOperation<T = any>(
    module: string,
    params: BulkOperationParams
  ): Promise<T> {
    // Map operations to correct endpoints
    let endpoint: string;
    let method: string = "POST";
    
    switch (params.operation) {
      case 'delete':
        endpoint = `/${this.appName}/${module}/bulk/soft-delete`;
        break;
      case 'hard-delete':
        endpoint = `/${this.appName}/${module}/bulk/hard-delete`;
        break;
      case 'restore':
        endpoint = `/${this.appName}/${module}/bulk/restore`;
        break;
      case 'update':
        endpoint = `/${this.appName}/${module}/bulk`;
        break;
      default:
        throw new Error(`Unsupported bulk operation: ${params.operation}`);
    }

    const response = await this.httpClient.request<T>(endpoint, {
      method,
      body: {
        ids: params.ids,
        ...(params.data && { data: params.data }),
      },
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(
        response.error || `Failed to perform bulk ${params.operation}`
      );
    }

    return response.data;
  }

  /**
   * Execute extra action on module item
   */
  async executeExtraAction<T = any>(
    module: string,
    params: ExtraActionParams
  ): Promise<T> {
    const response = await this.httpClient.request<T>(
      `/${this.appName}/${module}/${params.id}/actions/${params.actionKey}`,
      {
        method: "POST",
        body: params.data || {},
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
      }
    );

    if (!response.success) {
      throw new Error(
        response.error || `Failed to execute ${params.actionKey}`
      );
    }

    return response.data;
  }

  /**
   * Fetch reference data for dropdowns (supports dependencies)
   */
  async getReference<T = any>(
    module: string,
    queryParams?: Record<string, string>
  ): Promise<T[]> {
    let endpoint = `/${this.appName}/${module}/ref`;

    // Build query parameters
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          // Convert value to string to handle any type issues
          params.set(key, String(value));
        }
      });
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
    }


    const response = await this.httpClient.request<T[]>(endpoint, {
      method: "GET",
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || `Failed to fetch ${module} reference data from ${endpoint}`);
    }

    return response.data;
  }
}
