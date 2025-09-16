"use server";

import { revalidatePath } from "next/cache";
import { getApiDomain } from "@repo/utils/server";
import { getCachedServerHttpClient } from "@repo/api/server-only";
import { getCurrentUser, getCurrentSession } from "@repo/auth/server";
import { headers } from "next/headers";

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
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
 * Server action to fetch form schema for extra actions
 */
export async function fetchFormSchemaAction(
  moduleSlug: string,
  formName: string
): Promise<ActionResponse> {
  try {
    const { httpClient, context } = await createHttpClient();
    
    // Construct endpoint following the same pattern as ModuleService
    // Format: /{appName}/{module}/form-schema/{formName}
    const endpoint = `/${context.appName}/${moduleSlug}/form-schema/${formName}`;
    
    console.log(`📥 Fetching form schema from: ${endpoint}`);
    
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
  itemId: string
): Promise<ActionResponse<any[]>> {
  try {
    const { httpClient, context } = await createHttpClient();
    
    // Replace :id placeholder with actual ID
    let finalEndpoint = endpoint.replace(':id', itemId);
    
    // Ensure endpoint follows the correct pattern
    // If it doesn't start with /{appName}, prepend it
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
    
    console.log(`📥 Fetching table data from: ${finalEndpoint}`);
    
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
 * This follows the same pattern as executeExtraActionAction but uses httpClient directly
 */
export async function submitExtraActionForm(
  moduleSlug: string,
  actionKey: string,
  itemId: string,
  formData: FormData
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
    
    // Construct endpoint for extra action
    const endpoint = `/${context.appName}/${moduleSlug}/${itemId}/actions/${actionKey}`;
    
    const response = await httpClient.request<any>(endpoint, {
      method: "POST",
      body: processedData,
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