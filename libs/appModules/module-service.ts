import { createHttpClient } from "@repo/api";
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

  constructor(
    baseURL: string,
    options?: { tenantId?: string; userSessionId?: string; userId?: string }
  ) {
    this.httpClient = createHttpClient({
      baseURL,
      enableAuth: true,
      enableCSRF: false,
      timeout: 15000,
    });
    this.tenantId = options?.tenantId;
    this.userSessionId = options?.userSessionId;
    this.userId = options?.userId;
  }
  /**
   * Fetch module list with pagination and filters
   */
  async getList<T = any>(
    module: string,
    params: ModuleListParams = {}
  ): Promise<T[]> {
    let endpoint = `/core/${module}`;

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
    const response = await this.httpClient.request<T>(`/core/${module}/${id}`, {
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
    const response = await this.httpClient.request<T>(`/core/${module}`, {
      method: "POST",
      body: data,
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to create module item");
    }

    return response.data;
  }

  /**
   * Update existing module item
   */
  async update<T = any>(module: string, id: string, data: any): Promise<T> {
    const response = await this.httpClient.request<T>(`/core/${module}/${id}`, {
      method: "PUT",
      body: data,
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to update module item");
    }

    return response.data;
  }

  /**
   * Delete module item
   */
  async delete<T = any>(module: string, id: string): Promise<T> {
    const response = await this.httpClient.request<T>(`/core/${module}/${id}`, {
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
   * Bulk operations (delete/update multiple items)
   */
  async bulkOperation<T = any>(
    module: string,
    params: BulkOperationParams
  ): Promise<T> {
    const response = await this.httpClient.request<T>(`/core/${module}/bulk`, {
      method: "POST",
      body: {
        operation: params.operation,
        ids: params.ids,
        data: params.data,
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
      `/core/${module}/${params.id}/actions/${params.actionKey}`,
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
}
