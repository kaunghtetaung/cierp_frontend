import { getCachedServerHttpClient } from "@repo/api/server-only";
import type {
  ModuleListParams,
  BulkOperationParams,
  ExtraActionParams,
  ModuleItemWithNavigation,
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
   * Returns full response with pagination metadata for server-side pagination support
   */
  async getList<T = any>(
    module: string,
    params: ModuleListParams = {}
  ): Promise<{ data: T[]; pagination?: any }> {
    let endpoint = `/${this.appName}/${module}`;

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set("page", String(params.page));
    if (params.limit) queryParams.set("limit", String(params.limit));
    // Backend expects sortBy and sortOrder
    if (params.sort) queryParams.set("sortBy", params.sort);
    if (params.order) queryParams.set("sortOrder", params.order);

    // Add field filters with operators (e.g., filter[name][$regex]=test)
    // Or direct values for prefilters (e.g., catalogType.name=value)
    if (params.filters) {
      Object.entries(params.filters).forEach(([fieldName, filterValue]) => {
        // Check if filterValue is a string/number (direct value for prefilters)
        if (typeof filterValue === 'string' || typeof filterValue === 'number') {
          // Direct value - used for prefilters (e.g., catalogType.name)
          // This already handles comma-separated values as a single string
          queryParams.set(fieldName, String(filterValue));
        } else if (Array.isArray(filterValue)) {
          // Array of values - join with comma for multiple selection
          queryParams.set(fieldName, filterValue.join(','));
        } else if (typeof filterValue === 'object' && filterValue !== null) {
          // Object with operators
          Object.entries(filterValue).forEach(([operator, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              // Check if operator starts with $ (MongoDB operators) - these are typically prefilters
              // Prefilters use direct format: fieldName[$operator]=value
              // Regular filters use filter[fieldName][operator]=value format
              if (operator.startsWith('$')) {
                queryParams.set(`${fieldName}[${operator}]`, String(value));
              } else {
                queryParams.set(`filter[${fieldName}][${operator}]`, String(value));
              }
            }
          });
        }
      });
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    console.log("ModuleService API call:", {
      endpoint,
      params,
      queryParams: queryParams.toString(),
      fullUrl: endpoint
    });

    const response = await this.httpClient.request<any>(endpoint, {
      method: "GET",
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
      timeout: 25000, // 25 seconds timeout for module lists
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch module list");
    }

    // The backend may return either:
    // 1. Just an array (for client-side pagination): [item1, item2, ...]
    // 2. An object with data and pagination (for server-side pagination): { data: [...], pagination: {...} }
    const responseData = response.data;
    
    // Debug: Log the raw response structure
    console.log("ModuleService getList - raw response structure:", {
      hasData: !!responseData,
      isArray: Array.isArray(responseData),
      hasDataField: responseData && typeof responseData === 'object' && 'data' in responseData,
      hasPaginationField: responseData && typeof responseData === 'object' && 'pagination' in responseData,
      keys: responseData && typeof responseData === 'object' && !Array.isArray(responseData) ? Object.keys(responseData) : 'N/A',
    });
    
    // If response.data has a 'data' field, it includes pagination metadata
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      console.log("ModuleService getList - returning with pagination:", responseData.pagination);
      return {
        data: responseData.data as T[],
        pagination: responseData.pagination
      };
    }

    // Otherwise, it's just the array (client-side pagination)
    console.log("ModuleService getList - returning array without pagination");
    return {
      data: Array.isArray(responseData) ? responseData as T[] : [],
      pagination: undefined
    };
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
   * Fetch single module item by ID with navigation metadata
   */
  async getItemWithNavigation<T = any>(
    module: string, 
    id: string,
    options?: {
      includeNavigation?: boolean
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }
  ): Promise<ModuleItemWithNavigation<T>> {
    let endpoint = `/${this.appName}/${module}/${id}`;
    
    // Build query parameters for navigation
    if (options?.includeNavigation) {
      const queryParams = new URLSearchParams();
      queryParams.set("includeNavigation", "true");
      
      if (options.sortBy) {
        queryParams.set("sortBy", options.sortBy);
      }
      
      if (options.sortOrder) {
        queryParams.set("sortOrder", options.sortOrder);
      }
      
      endpoint += `?${queryParams.toString()}`;
    }

    console.log('📡 [MODULE SERVICE] Requesting:', endpoint);
    console.log('🔑 [MODULE SERVICE] With context:', {
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      appName: this.appName
    });
    
    const response = await this.httpClient.request<any>(`${endpoint}`, {
      method: "GET",
      tenantId: this.tenantId,
      userSessionId: this.userSessionId,
      userId: this.userId,
      withAuth: true,
    });

    console.log('📦 [MODULE SERVICE] Raw response:', {
      success: response.success,
      hasData: !!response.data,
      dataType: typeof response.data,
      dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : [],
      sampleData: JSON.stringify(response.data).substring(0, 200)
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch module item with navigation");
    }

    // If navigation is not requested, return data in the expected format
    if (!options?.includeNavigation) {
      console.log('📤 [MODULE SERVICE] Returning without navigation');
      return { data: response.data };
    }

    // Backend returns { data: {...}, navigation: {...} } when includeNavigation=true
    // The response.data contains the full backend response
    // Check if the response has the expected structure
    if (response.data && typeof response.data === 'object' && 'data' in response.data && 'navigation' in response.data) {
      console.log('✅ [MODULE SERVICE] Response has navigation structure:', {
        hasData: 'data' in response.data,
        hasNavigation: 'navigation' in response.data,
        navigation: response.data.navigation
      });
      return response.data as ModuleItemWithNavigation<T>;
    }
    
    // Fallback if backend doesn't return navigation structure
    console.log('⚠️ [MODULE SERVICE] Response missing navigation structure, returning data only');
    return { data: response.data };
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
    
    console.log('🔍 [MODULE SERVICE] getReference:', {
      appName: this.appName,
      module,
      endpoint,
      queryParams
    });

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
