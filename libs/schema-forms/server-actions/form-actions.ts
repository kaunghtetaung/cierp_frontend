"use server";

import { revalidatePath } from "next/cache";
import { getApiDomain } from "@repo/utils/server";
import { getCachedServerHttpClient } from "@repo/api/server-only";
import { getCurrentUser, getCurrentSession } from "@repo/auth/server";
import { headers } from "next/headers";
import { getCacheInstance, CacheKeys } from "@repo/cache";
import { createModuleItem } from "@repo/app-modules";

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Submit Quick Entry form data directly to an endpoint
 */
export async function submitQuickEntryForm(
  endpoint: string,
  data: Record<string, any>,
  serviceName?: string
): Promise<ActionResponse> {
  try {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Extract the module name from the endpoint (e.g., "authors" from "/authors")
    const moduleName = cleanEndpoint.split('/')[0];
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 QuickEntry submission:', {
        endpoint,
        moduleName,
        serviceName,
        data
      });
    }
    
    // Use the wrapper function which properly handles authentication
    const result = await createModuleItem(moduleName, data, serviceName);
    
    if (result) {
      return {
        success: true,
        data: result
      };
    }
    
    return {
      success: false,
      error: 'Failed to create entry'
    };
  } catch (error: any) {
    console.error('Quick Entry submission error:', error);
    
    // Handle validation errors
    if (error.response?.data?.extra?.fieldErrors) {
      return {
        success: false,
        error: error.response.data.message || 'Validation failed',
        errors: error.response.data.extra.fieldErrors
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create entry'
    };
  }
}

/**
 * Create a configured HTTP client with authentication context
 */
async function createHttpClient() {
  const apiUrl = await getApiDomain();
  const headerStore = await headers();
  
  // Get authentication context
  const [session, user] = await Promise.all([
    getCurrentSession(headerStore),
    getCurrentUser(headerStore)
  ]);
  
  const httpClient = getCachedServerHttpClient(apiUrl);
  
  // Return client with auth context
  return {
    httpClient,
    context: {
      tenantId: user?.tenantId || session?.tenantId || headerStore.get("x-tenant-id") || undefined,
      userSessionId: session?.id,
      userId: user?.userId || user?.id,
      appName: headerStore.get("x-app-id") || 'core',
    }
  };
}

/**
 * Server action to fetch form schema for extra actions with Redis caching
 */
export async function fetchFormSchemaAction(
  moduleSlug: string,
  formName: string
): Promise<ActionResponse> {
  try {
    const { httpClient, context } = await createHttpClient();
    
    // Check if we have a tenantId for caching
    if (context.tenantId) {
      // Get cache instance
      const cache = getCacheInstance();
      
      // Build cache key
      const cacheKey = CacheKeys.extraActionForm(context.tenantId, formName);
      
      // Try to get from cache first
      console.log(`🔍 Checking cache for form schema: ${cacheKey}`);
      const cachedData = await cache.get(cacheKey);
      
      if (cachedData) {
        console.log(`✅ Form schema found in cache: ${formName}`);
        return {
          success: true,
          data: cachedData,
        };
      }
    }
    
    // Construct endpoint following the same pattern as ModuleService
    // Format: /{appName}/{module}/form-schema/{formName}
    const endpoint = `/${context.appName}/${moduleSlug}/form-schema/${formName}`;
    
    console.log(`📥 Fetching form schema from API: ${endpoint}`);
    
    const response = await httpClient.request<any>(endpoint, {
      method: "GET",
      tenantId: context.tenantId,
      userSessionId: context.userSessionId,
      userId: context.userId,
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || `Failed to fetch form schema for ${formName}`);
    }

    // Cache the response if we have a tenantId
    if (context.tenantId && response.data) {
      const cache = getCacheInstance();
      const cacheKey = CacheKeys.extraActionForm(context.tenantId, formName);
      
      // Cache for 1 hour (3600 seconds)
      const ttl = 3600;
      
      console.log(`💾 Caching form schema for ${ttl} seconds: ${cacheKey}`);
      await cache.set(cacheKey, response.data, ttl);
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(`Error fetching form schema for ${formName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch form schema`,
    };
  }
}

/**
 * Server action to fetch table data for form sections
 */
export async function fetchFormTableDataAction(
  endpoint: string,
  itemId: string,
  moduleSlug?: string
): Promise<ActionResponse<any[]>> {
  console.log('🔍 fetchFormTableDataAction: Input params', {
    endpoint,
    itemId,
    moduleSlug
  });
  
  try {
    const { httpClient, context } = await createHttpClient();
    
    // Handle endpoint construction based on pattern
    let finalEndpoint = endpoint;
    
    // Check if this is a pattern like "/:id/accessions" BEFORE replacing the ID
    if (endpoint.startsWith('/:id/') && moduleSlug) {
      // Transform "/:id/accessions" to "/bibliographies/:id/accessions"
      finalEndpoint = `/${moduleSlug}${endpoint}`;
    }
    
    // Now replace :id placeholder with actual ID
    finalEndpoint = finalEndpoint.replace(':id', itemId);
    
    // Handle other patterns that might not have :id
    if (!finalEndpoint.includes(itemId) && moduleSlug && finalEndpoint.startsWith('/') && !finalEndpoint.startsWith(`/${moduleSlug}/`)) {
      // Prepend module slug if not already present and no ID was replaced
      finalEndpoint = `/${moduleSlug}${finalEndpoint}`;
    }
    
    // Ensure endpoint follows the correct pattern with appName
    if (!finalEndpoint.startsWith(`/${context.appName}/`)) {
      // If it starts with /api/v1/, replace with /{appName}/
      if (finalEndpoint.startsWith('/api/v1/')) {
        finalEndpoint = finalEndpoint.replace('/api/v1/', `/${context.appName}/`);
      } else if (finalEndpoint.startsWith('/')) {
        // If it starts with just /, prepend appName
        finalEndpoint = `/${context.appName}${finalEndpoint}`;
      } else {
        // No leading slash, add appName prefix
        finalEndpoint = `/${context.appName}/${finalEndpoint}`;
      }
    }
    
    console.log(`📥 Fetching table data from: ${finalEndpoint}`, {
      tenantId: context.tenantId,
      appName: context.appName,
      moduleSlug
    });
    
    const response = await httpClient.request<any[]>(finalEndpoint, {
      method: "GET",
      tenantId: context.tenantId,
      userSessionId: context.userSessionId,
      userId: context.userId,
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch table data');
    }

    return {
      success: true,
      data: response.data || [],
    };
  } catch (error) {
    console.error('Error fetching table data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch table data',
      data: [],
    };
  }
}

/**
 * Server action to submit extra action forms
 * Uses the endpoint configuration from the backend schema
 */
export async function submitExtraActionForm(
  moduleSlug: string,
  actionKey: string,
  itemId: string,
  formData: FormData,
  actionEndpoint?: string,  // Endpoint from action schema (e.g., "/:id/accessions")
  actionMethod?: string     // HTTP method from action schema
): Promise<ActionResponse> {
  try {
    const { httpClient, context } = await createHttpClient();
    
    // Convert FormData to object
    const data: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      // Handle different value types safely
      if (value instanceof File) {
        data[key] = value.name;
      } else if (typeof value === 'string') {
        data[key] = value;
      } else if (value === null || value === undefined) {
        data[key] = "";
      } else {
        try {
          data[key] = String(value);
        } catch {
          data[key] = "";
        }
      }
    }
    
    
    // Handle nested object fields (e.g., displayName.en)
    const processedData: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (key.includes(".")) {
        const [parentKey, childKey] = key.split(".");
        if (!processedData[parentKey]) {
          processedData[parentKey] = {};
        }
        processedData[parentKey][childKey] = value;
      } else {
        // Check if value is a JSON string that needs parsing
        if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
          try {
            processedData[key] = JSON.parse(value);
          } catch {
            processedData[key] = value;
          }
        } else {
          processedData[key] = value;
        }
      }
    });
    
    // Extract operation type and item identifier before removing them from data
    const operation = processedData.action || 'add';  // 'add', 'update', 'delete' - default to 'add'
    // For updates, prefer using _id, then itemId, then accessionNo
    const itemIdentifier = processedData.itemId || processedData._id || processedData.accessionNo;  
    
    
    // Remove internal routing fields that backend doesn't expect
    // NOTE: Keep _id field as it's needed by backend for updates
    const fieldsToRemove = ['actionKey', 'moduleSlug', 'action', 'itemId', 'id'];
    const cleanedData: Record<string, any> = {};
    
    Object.entries(processedData).forEach(([key, value]) => {
      if (!fieldsToRemove.includes(key)) {
        cleanedData[key] = value;
      }
    });
    
    
    // Construct endpoint based on backend schema or fallback to legacy pattern
    let endpoint: string;
    let method: string;
    
    if (actionEndpoint) {
      // Use backend-supplied endpoint pattern
      endpoint = actionEndpoint.replace(':id', itemId);
      
      // Handle CRUD operations for table sections
      if (operation === 'update' && itemIdentifier) {
        endpoint = `${endpoint}/${itemIdentifier}`;
        method = 'PATCH';
      } else if (operation === 'delete' && itemIdentifier) {
        endpoint = `${endpoint}/${itemIdentifier}`;
        method = 'DELETE';
      } else if (operation === 'add') {
        // For add operations, append /add to the endpoint
        endpoint = `${endpoint}/add`;
        method = actionMethod || 'POST';
      } else {
        method = actionMethod || 'POST';
      }
      
      // Add app context and module
      endpoint = `/${context.appName}/${moduleSlug}${endpoint}`;
    } else {
      // Fallback to legacy pattern for backward compatibility
      endpoint = `/${context.appName}/${moduleSlug}/${itemId}/actions/${actionKey}`;
      method = 'POST';
    }
    
    
    
    const response = await httpClient.request<any>(endpoint, {
      method,
      body: cleanedData,  // Send cleaned data without internal fields
      tenantId: context.tenantId,
      userSessionId: context.userSessionId,
      userId: context.userId,
      withAuth: true,
    });
    
    if (!response.success) {
      throw new Error(response.error || `Failed to execute ${actionKey}`);
    }

    // Revalidate affected pages
    revalidatePath(`/${moduleSlug}`);
    revalidatePath(`/${moduleSlug}/${itemId}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(`Error executing extra action ${actionKey}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to execute ${actionKey}`,
    };
  }
}

/**
 * Server action for bulk extra actions (when multiple items are selected)
 */
/**
 * Server action to clear cached form schema
 */
export async function clearFormSchemaCache(
  formName: string
): Promise<ActionResponse> {
  try {
    const headerStore = await headers();
    const [session, user] = await Promise.all([
      getCurrentSession(headerStore),
      getCurrentUser(headerStore)
    ]);
    
    const tenantId = user?.tenantId || session?.tenantId || headerStore.get("x-tenant-id");
    
    if (!tenantId) {
      return {
        success: false,
        error: "Unable to determine tenant context",
      };
    }
    
    const cache = getCacheInstance();
    const cacheKey = CacheKeys.extraActionForm(tenantId, formName);
    
    console.log(`🗑️ Clearing form schema cache: ${cacheKey}`);
    await cache.delete(cacheKey);
    
    return {
      success: true,
      data: { message: `Cache cleared for form: ${formName}` },
    };
  } catch (error) {
    console.error(`Error clearing form schema cache:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clear cache",
    };
  }
}

/**
 * Server action to clear all form schema caches for a tenant
 */
export async function clearAllFormSchemaCache(): Promise<ActionResponse> {
  try {
    const headerStore = await headers();
    const [session, user] = await Promise.all([
      getCurrentSession(headerStore),
      getCurrentUser(headerStore)
    ]);
    
    const tenantId = user?.tenantId || session?.tenantId || headerStore.get("x-tenant-id");
    
    if (!tenantId) {
      return {
        success: false,
        error: "Unable to determine tenant context",
      };
    }
    
    const cache = getCacheInstance();
    const pattern = `ciApp:${tenantId}:ExtraActionForm:*`;
    
    console.log(`🗑️ Clearing all form schema caches for tenant: ${pattern}`);
    
    // Get all keys matching the pattern
    const keys = await cache.keys(pattern);
    
    if (keys.length > 0) {
      // Delete all matching keys
      await Promise.all(keys.map(key => cache.delete(key)));
      console.log(`✅ Cleared ${keys.length} form schema cache entries`);
    }
    
    return {
      success: true,
      data: { message: `Cleared ${keys.length} form schema cache entries` },
    };
  } catch (error) {
    console.error(`Error clearing all form schema caches:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clear caches",
    };
  }
}

/**
 * Server action to get cache statistics for form schemas
 */
export async function getFormSchemaCacheStats(): Promise<ActionResponse> {
  try {
    const headerStore = await headers();
    const [session, user] = await Promise.all([
      getCurrentSession(headerStore),
      getCurrentUser(headerStore)
    ]);
    
    const tenantId = user?.tenantId || session?.tenantId || headerStore.get("x-tenant-id");
    
    if (!tenantId) {
      return {
        success: false,
        error: "Unable to determine tenant context",
      };
    }
    
    const cache = getCacheInstance();
    const pattern = `ciApp:${tenantId}:ExtraActionForm:*`;
    
    // Get all keys matching the pattern
    const keys = await cache.keys(pattern);
    
    // Extract form names from keys
    const formNames = keys.map(key => {
      const parts = key.split(':');
      return parts[parts.length - 1]; // Last part is the form name
    });
    
    return {
      success: true,
      data: {
        totalCached: keys.length,
        formNames,
        cacheKeyPattern: pattern,
      },
    };
  } catch (error) {
    console.error(`Error getting form schema cache stats:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get cache stats",
    };
  }
}

export async function submitBulkExtraActionForm(
  moduleSlug: string,
  actionKey: string,
  itemIds: string[],
  formData: FormData
): Promise<ActionResponse> {
  try {
    const { httpClient, context } = await createHttpClient();
    
    // Convert FormData to object
    const data: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        data[key] = value.name;
      } else if (typeof value === 'string') {
        data[key] = value;
      } else {
        data[key] = String(value);
      }
    }
    
    // Handle nested fields
    const processedData: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (key.includes(".")) {
        const [parentKey, childKey] = key.split(".");
        if (!processedData[parentKey]) {
          processedData[parentKey] = {};
        }
        processedData[parentKey][childKey] = value;
      } else {
        processedData[key] = value;
      }
    });
    
    // Add selected IDs to the payload
    processedData.ids = itemIds;
    
    // Construct bulk action endpoint
    const endpoint = `/${context.appName}/${moduleSlug}/bulk/actions/${actionKey}`;
    
    const response = await httpClient.request<any>(endpoint, {
      method: "POST",
      body: processedData,
      tenantId: context.tenantId,
      userSessionId: context.userSessionId,
      userId: context.userId,
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || `Failed to execute bulk ${actionKey}`);
    }

    // Revalidate the module list page
    revalidatePath(`/${moduleSlug}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(`Error executing bulk action ${actionKey}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to execute bulk ${actionKey}`,
    };
  }
}