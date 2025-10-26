"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reportError } from "@repo/utils/common/error-reporter";
import { ApplicationError } from "@repo/utils/common/error-types";
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
  pagination?: any;
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
    const response = await getModuleList<T>(module, params);

    return {
      success: true,
      data: response.data,
      pagination: response.pagination,
    };
  } catch (error) {
    // Report error with structured logging
    const appError = new ApplicationError({
      type: 'SERVER_ACTION_ERROR',
      message: error instanceof Error ? error.message : `Failed to fetch ${module} list`,
      severity: 'high',
      category: 'server-action',
      operation: 'fetch-module-list',
      component: 'module-actions',
      cause: error instanceof Error ? error : undefined,
      metadata: {
        module,
        params,
        action: 'getModuleListAction'
      }
    });

    reportError(appError).catch(err => {
      console.error('Failed to report server action error:', err);
    });

    // Fallback console logging
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
  formData: FormData | Record<string, any>,
  action: "create" | "update",
  id?: string,
  skipRedirect?: boolean
): Promise<ActionResponse> {
  try {
    console.log(`🚀 Starting ${action} operation for module: ${module}`);

    let processedData: Record<string, any>;

    // Check if formData is FormData or plain object
    if (formData instanceof FormData) {
      // Legacy FormData handling
      console.log("🔍 Debug: Processing FormData (legacy path)...");
      const data: Record<string, any> = {};

      let entryCount = 0;
      for (const [key, value] of formData.entries()) {
        entryCount++;

        try {
          if (value instanceof File) {
            data[key] = value.name;
          } else if (typeof value === 'string') {
            data[key] = value;
          } else if (value === null || value === undefined) {
            data[key] = "";
          } else {
            const isClientRef = (value as any)?.$$typeof === Symbol.for('react.client.reference') ||
                              (value as any)?.$$typeof === Symbol.for('react.element') ||
                              (typeof value === 'object' && value && (value as any).constructor?.name?.includes('Client'));

            if (isClientRef) {
              data[key] = "[CLIENT_REFERENCE]";
            } else if (typeof value === 'number' || typeof value === 'boolean') {
              data[key] = String(value);
            } else if (typeof value === 'object' && value !== null) {
              try {
                data[key] = JSON.stringify(value);
              } catch (jsonError) {
                data[key] = "[COMPLEX_OBJECT]";
              }
            } else {
              data[key] = String(value);
            }
          }
        } catch (error) {
          const isToStringError = error instanceof Error &&
            error.message.includes('Cannot access toString on the server');
          const isClientReferenceError = error instanceof Error &&
            error.message.includes('client reference');

          if (isToStringError || isClientReferenceError) {
            data[key] = "[CLIENT_REFERENCE_ERROR]";
          } else {
            data[key] = "[CONVERSION_FAILED]";
          }
        }
      }

      console.log(`🔍 Debug: Processed ${entryCount} FormData entries`);

      // Handle nested object fields (e.g., displayName.en)
      processedData = {};
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
    } else {
      // Direct JSON object (new path) - will be sent with Content-Type: application/json
      console.log("✅ Debug: Received plain object, sending as JSON");
      processedData = formData;
    }

    console.log("📝 Final data to send (will use Content-Type: application/json):", processedData);

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
        
        // Handle various backend error types that should show user-friendly messages
        if (errorData.errorCode === 'FORM_VALIDATION_FAIL') {
          console.log("🔍 Backend validation error detected:", errorData);
          return {
            success: false,
            error: errorData.message,
            fieldErrors: errorData.extra?.fieldErrors || [],
            traceId: errorData.traceId,
          };
        } else if (errorData.errorCode === 'BAD_REQUEST_FORMAT') {
          console.log("🔍 Bad request format error detected:", errorData);
          return {
            success: false,
            error: errorData.message || "The request format is invalid",
            traceId: errorData.traceId,
          };
        } else if (errorData.statusCode >= 400 && errorData.statusCode < 500) {
          // Handle other client errors (4xx) with user-friendly messages
          console.log("🔍 Client error detected:", errorData);
          return {
            success: false,
            error: errorData.message || `Request failed with status ${errorData.statusCode}`,
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
    const result = await deleteModuleItemService(module, id);
    
    // Ensure the deletion actually succeeded
    if (!result) {
      throw new Error(`Delete operation returned no result for ${module} item ${id}`);
    }

    // Revalidate the module list page
    revalidatePath(`/${module}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(`Error deleting ${module} item:`, error);
    
    // Provide more specific error messages
    let errorMessage = `Failed to delete ${module} item`;
    
    if (error instanceof Error) {
      // Check for network/connection errors
      if (error.message.includes('fetch') || 
          error.message.includes('ECONNREFUSED') || 
          error.message.includes('ENOTFOUND') ||
          error.message.includes('network') ||
          error.message.includes('connect')) {
        errorMessage = `Cannot connect to server. Please ensure the backend service is running.`;
      } else if (error.message.includes('timeout')) {
        errorMessage = `Request timed out. The server may be slow or unresponsive.`;
      } else if (error.message.includes('404')) {
        errorMessage = `Item not found or already deleted.`;
      } else if (error.message.includes('403') || error.message.includes('401')) {
        errorMessage = `Permission denied. You may not have access to delete this item.`;
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
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
    // Convert FormData to object if provided - manually process to avoid toString() calls on client references
    const data: Record<string, any> = {};
    if (formData) {
      console.log("🔍 Debug (Extra Action): Starting FormData processing...");
      let entryCount = 0;
      
      for (const [key, value] of formData.entries()) {
        entryCount++;
        console.log(`🔍 Debug (Extra Action): Processing entry ${entryCount}:`, {
          key,
          valueType: typeof value,
          valueConstructor: value?.constructor?.name,
          isFile: value instanceof File,
          isString: typeof value === 'string',
          hasToString: typeof value?.toString === 'function',
          valuePreview: value instanceof File ? `File(${value.name})` : String(value).substring(0, 100)
        });
        
        try {
          // Enhanced client-safe value conversion (same logic as main form submission)
          if (value instanceof File) {
            data[key] = value.name;
            console.log(`✅ Debug (Extra Action): Successfully converted File entry ${entryCount} for key "${key}": "${value.name}"`);
          } else if (typeof value === 'string') {
            data[key] = value;
            console.log(`✅ Debug (Extra Action): Successfully converted string entry ${entryCount} for key "${key}"`);
          } else if (value === null || value === undefined) {
            data[key] = "";
            console.log(`✅ Debug (Extra Action): Successfully converted null/undefined entry ${entryCount} for key "${key}"`);
          } else {
            const isClientRef = (value as any)?.$$typeof === Symbol.for('react.client.reference') || 
                              (value as any)?.$$typeof === Symbol.for('react.element') ||
                              (typeof value === 'object' && value && (value as any).constructor?.name?.includes('Client'));
            
            if (isClientRef) {
              console.warn(`🚨 Debug (Extra Action): Detected potential client reference in entry ${entryCount} for key "${key}" - using safe fallback`);
              data[key] = "[CLIENT_REFERENCE]";
              console.log(`✅ Debug (Extra Action): Safely handled client reference for key "${key}"`);
            } else if (typeof value === 'number' || typeof value === 'boolean') {
              data[key] = String(value);
              console.log(`✅ Debug (Extra Action): Successfully converted primitive entry ${entryCount} for key "${key}"`);
            } else if (typeof value === 'object' && value !== null) {
              try {
                data[key] = JSON.stringify(value);
                console.log(`✅ Debug (Extra Action): Successfully converted object entry ${entryCount} for key "${key}" via JSON`);
              } catch (jsonError) {
                data[key] = "[COMPLEX_OBJECT]";
                console.log(`✅ Debug (Extra Action): Used object fallback for key "${key}" (JSON serialization failed)`);
              }
            } else {
              data[key] = String(value);
              console.log(`✅ Debug (Extra Action): Successfully converted entry ${entryCount} for key "${key}" via String()`);
            }
          }
        } catch (error) {
          console.error(`❌ Debug (Extra Action): Error converting entry ${entryCount} for key "${key}":`, {
            error: error instanceof Error ? error.message : String(error),
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorStack: error instanceof Error ? error.stack : undefined,
            valueType: typeof value,
            valueConstructor: value?.constructor?.name
          });
          
          const isToStringError = error instanceof Error && 
            error.message.includes('Cannot access toString on the server');
          const isClientReferenceError = error instanceof Error && 
            error.message.includes('client reference');
          
          if (isToStringError || isClientReferenceError) {
            data[key] = "[CLIENT_REFERENCE_ERROR]";
            console.log(`🛡️ Debug (Extra Action): Used client reference error fallback for key "${key}"`);
          } else {
            data[key] = "[CONVERSION_FAILED]";
            console.log(`🛡️ Debug (Extra Action): Used general conversion error fallback for key "${key}"`);
          }
        }
      }
      
      console.log(`🔍 Debug (Extra Action): Processed ${entryCount} FormData entries`);
    }

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
  queryParams?: Record<string, string>,
  serviceName?: string
): Promise<ActionResponse<T[]>> {
  try {
    // Always log serviceName to debug cross-service issues
    console.log(`🚀 getModuleReferenceAction: Starting request for module "${module}"`, {
      queryParams,
      serviceName,
      serviceNameType: typeof serviceName,
      isServiceNameDefined: serviceName !== undefined,
      isServiceNameNull: serviceName === null,
      isServiceNameEmpty: serviceName === ''
    });
    
    const data = await getModuleReference<T>(module, queryParams, serviceName);
    
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
