"use server";

import { revalidatePath } from 'next/cache';
import { updateModuleItem } from '../wrapper';

interface ExtraActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function executeExtraAction(formData: FormData): Promise<ExtraActionResult> {
  try {
    const actionKey = formData.get("actionKey") as string;
    const moduleSlug = formData.get("moduleSlug") as string;
    const id = formData.get("id") as string;
    const selectedIds = formData.getAll("selectedIds") as string[];

    if (!actionKey || !moduleSlug) {
      throw new Error("Missing required action parameters");
    }

    // For actions that don't require an ID (like bulk operations)
    let targetId = id;
    if (!targetId && selectedIds.length > 0) {
      targetId = selectedIds[0]; // Use first selected item as target ID
    }

    if (!targetId) {
      throw new Error("Missing target ID for action");
    }

    // Prepare action data from form fields
    const actionData: Record<string, any> = {};
    
    // Copy all form fields except metadata
    for (const [key, value] of formData.entries()) {
      if (!["actionKey", "moduleSlug", "id", "selectedIds"].includes(key)) {
        actionData[key] = value;
      }
    }
    
    // Add selected IDs for bulk operations
    if (selectedIds.length > 0) {
      actionData.selectedIds = selectedIds;
    }

    console.log(`Executing extra action: ${actionKey} on module: ${moduleSlug} with id: ${targetId}`, actionData);

    // Use standard PATCH method for extra actions (e.g., adding applications to organizations)
    const result = await updateModuleItem(moduleSlug, targetId, actionData);

    // Revalidate the affected pages
    revalidatePath(`/${moduleSlug}`);
    revalidatePath(`/${moduleSlug}/[id]`, 'page');

    return {
      success: true,
      message: result.message || "Action completed successfully",
      data: result,
    };

  } catch (error) {
    console.error("Extra action execution error:", error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

