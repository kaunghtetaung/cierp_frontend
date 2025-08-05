"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createModuleItem,
  updateModuleItem,
  deleteModuleItem as deleteModuleItemService,
  bulkModuleOperation as bulkModuleOperationService,
  executeModuleExtraAction,
  getModuleList,
  getModuleItem,
  getModuleReference,
} from "../wrapper";
import { ModuleListParams } from "../types";

// Backend validation error response structure
export interface BackendValidationError {
  statusCode: number;
  errorCode: string;
  message: string;
  traceId: string;
  timestamp: string;
  path: string;
  extra?: {
    fieldErrors?: string[];
    requestId?: string;
    backendExtra?: {
      fieldErrors?: string[];
    };
  };
}

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  fieldErrors?: string[];
  traceId?: string;
  redirectTo?: string;
}

/**
 * Server action to fetch module list
 * This allows client components to fetch data using server actions
 */
export async function getModuleListAction<T = any>(
  module: string,
  params: ModuleListParams = {}
): Promise<ActionResponse<T[]>> {
  try {
    const data = await getModuleList<T>(module, params);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`Error fetching ${module} list:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Failed to fetch ${module} list`,
    };
  }
}

/**
 * Server action to fetch a single module item
 */
export async function getModuleItemAction<T = any>(
  module: string,
  id: string
): Promise<ActionResponse<T>> {
  const startTime = performance.now();
  try {
    const data = await getModuleItem<T>(module, id);
    const duration = performance.now() - startTime;
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`Error fetching ${module} item:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Failed to fetch ${module} item`,
    };
  }
}

/**
 * Generic server action for module operations
 */
export async function submitModuleForm(
  module: string,
  formData: FormData,
  action: "create" | "update",
  id?: string,
  skipRedirect?: boolean
): Promise<ActionResponse> {
  try {
    console.log(`🚀 Starting ${action} operation for module: ${module}`);
    
    // Convert FormData to object
    const data = Object.fromEntries(formData);
    console.log("📝 Raw form data:", data);

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
        processedData[key] = value;
      }
    });
    console.log("🔄 Processed form data:", processedData);

    // Call API using ModuleService (validation will be handled by the backend)
    console.log(`📡 Calling ${action} API...`);
    let result;
    if (action === "create") {
      result = await createModuleItem(module, processedData);
    } else {
      if (!id) {
        return {
          success: false,
          error: "ID is required for update operation",
        };
      }
      result = await updateModuleItem(module, id, processedData);
    }
    
    console.log("🎉 API call successful:", result);

    // Revalidate the module list page
    revalidatePath(`/${module}`);

    if (action === "create" && !skipRedirect) {
      // Redirect to the module list page after creation
      redirect(`/${module}`);
    }

    return {
      success: true,
      data: result,
      redirectTo: action === "create" ? `/${module}` : undefined,
    };
  } catch (error) {
    console.error(`Error in ${action} ${module}:`, error);
    
    // Check if this is a backend validation error
    if (error instanceof Error) {
      try {
        // Try to parse the error message as JSON (from HTTP client)
        const errorData = JSON.parse(error.message);
        if (errorData.errorCode === 'FORM_VALIDATION_FAIL') {
          console.log("🔍 Backend validation error detected:", errorData);
          return {
            success: false,
            error: errorData.message,
            fieldErrors: errorData.extra?.fieldErrors || [],
            traceId: errorData.traceId,
          };
        }
      } catch (parseError) {
        // Not a JSON error, handle as regular error
        console.log("📝 Regular error (not JSON):", error.message);
      }
    }
    
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Failed to ${action} ${module}`,
    };
  }
}

/**
 * Server action to soft delete module item
 */
export async function deleteModuleItemAction(
  module: string,
  id: string
): Promise<ActionResponse> {
  try {
    await deleteModuleItemService(module, id);

    // Revalidate the module list page
    revalidatePath(`/${module}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Error deleting ${module} item:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Failed to delete ${module} item`,
    };
  }
}

/**
 * Server action to hard delete module item
 */
export async function hardDeleteModuleItemAction(
  module: string,
  id: string
): Promise<ActionResponse> {
  try {
    // Call the hard delete endpoint
    const response = await fetch(`/api/${module}/hard/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Hard delete failed: ${response.statusText}`);
    }

    // Revalidate the module list page
    revalidatePath(`/${module}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Error hard deleting ${module} item:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Failed to permanently delete ${module} item`,
    };
  }
}

/**
 * Server action to restore soft deleted module item
 */
export async function restoreModuleItemAction(
  module: string,
  id: string
): Promise<ActionResponse> {
  try {
    // Call the restore endpoint
    const response = await fetch(`/api/${module}/deleted/restore/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Restore failed: ${response.statusText}`);
    }

    // Revalidate the module list and deleted items pages
    revalidatePath(`/${module}`);
    revalidatePath(`/${module}/deleted`);

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Error restoring ${module} item:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Failed to restore ${module} item`,
    };
  }
}

/**
 * Server action to get deleted items
 */
export async function getDeletedModuleItemsAction<T = any>(
  module: string
): Promise<ActionResponse<T[]>> {
  try {
    // Call the deleted items endpoint
    const response = await fetch(`/api/${module}/deleted/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch deleted items: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`Error fetching deleted ${module} items:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Failed to fetch deleted ${module} items`,
    };
  }
}

/**
 * Server action for bulk operations
 */
export async function bulkModuleOperationAction(
  module: string,
  operation: "delete" | "hard-delete" | "restore" | "update",
  ids: string[],
  updateData?: Record<string, any>
): Promise<ActionResponse> {
  try {
    const result = await bulkModuleOperationService(module, {
      operation,
      ids,
      data: updateData,
    });

    // Revalidate the module list page
    revalidatePath(`/${module}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(`Error in bulk ${operation}:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Failed to perform bulk ${operation}`,
    };
  }
}

/**
 * Server action to execute extra action forms
 */
export async function executeExtraActionAction(
  module: string,
  actionKey: string,
  id: string,
  formData?: FormData
): Promise<ActionResponse> {
  try {
    // Convert FormData to object if provided
    const data = formData ? Object.fromEntries(formData) : {};

    const result = await executeModuleExtraAction(module, {
      actionKey,
      id,
      data,
    });

    // Revalidate both item and list pages
    revalidatePath(`/${module}`);
    revalidatePath(`/${module}/${id}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(`Error executing ${actionKey}:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Failed to execute ${actionKey}`,
    };
  }
}

/**
 * Server action to fetch reference data for dropdowns
 * This supports dependent dropdowns with query parameters
 */
export async function getModuleReferenceAction<T = any>(
  module: string,
  queryParams?: Record<string, string>
): Promise<ActionResponse<T[]>> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 getModuleReferenceAction: Starting request for module "${module}" with params:`, queryParams);
    }
    
    const data = await getModuleReference<T>(module, queryParams);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ getModuleReferenceAction: Successfully fetched ${Array.isArray(data) ? data.length : 'unknown'} items for module "${module}"`);
    }
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    // Enhanced error logging to debug the generic error issue
    console.error(`❌ getModuleReferenceAction: Error fetching ${module} reference data:`, {
      error,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      module,
      queryParams,
      timestamp: new Date().toISOString()
    });
    
    // Check if this is an API error with more details
    if (error && typeof error === 'object') {
      console.error(`🔍 getModuleReferenceAction: Additional error properties:`, {
        category: (error as any).category,
        statusCode: (error as any).statusCode,
        errorCode: (error as any).errorCode,
        backendMessage: (error as any).backendMessage,
        userMessage: (error as any).userMessage,
        details: (error as any).details
      });
    }
    
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Failed to fetch ${module} reference data`,
    };
  }
}
