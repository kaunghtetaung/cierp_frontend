"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createModuleItem,
  updateModuleItem,
  deleteModuleItem as deleteModuleItemService,
  bulkModuleOperation as bulkModuleOperationService,
  executeModuleExtraAction,
  getModuleList,
  getModuleItem,
} from "../wrapper";
import { ModuleListParams } from "../types";

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
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
    console.log(`Fetching module item: ${module}/${id}`);
    const data = await getModuleItem<T>(module, id);
    const duration = performance.now() - startTime;
    console.log(
      `Module item fetched in ${duration.toFixed(2)}ms for ${module}/${id}`
    );
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
  validationSchema: z.ZodSchema,
  action: "create" | "update",
  id?: string
): Promise<ActionResponse> {
  try {
    // Convert FormData to object
    const data = Object.fromEntries(formData);

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

    // Validate data
    const validationResult = validationSchema.safeParse(processedData);

    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((error: z.ZodIssue) => {
        const path = error.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(error.message);
      });

      return {
        success: false,
        errors,
      };
    }

    // Call API using ModuleService
    let result;
    if (action === "create") {
      result = await createModuleItem(module, validationResult.data);
    } else {
      if (!id) {
        return {
          success: false,
          error: "ID is required for update operation",
        };
      }
      result = await updateModuleItem(module, id, validationResult.data);
    }

    // Revalidate the module list page
    revalidatePath(`/${module}`);

    if (action === "create") {
      // Redirect to the module list page after creation
      redirect(`/${module}`);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(`Error in ${action} ${module}:`, error);
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
 * Delete module item
 */
export async function deleteModuleItem(
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
 * Bulk operations
 */
export async function bulkModuleOperation(
  module: string,
  operation: "delete" | "update",
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
 * Execute extra action forms
 */
export async function executeExtraAction(
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
