"use server";

import { revalidatePath } from 'next/cache';
import { updateModuleItem } from '../wrapper';
import { ModuleService } from '../module-service';
import { getApiDomain } from "@repo/utils/server";
import { getCurrentUser, getCurrentSession } from "@repo/auth/server";

interface ExtraActionResult {
  success: boolean;
  message: string;
  data?: any;
}

// Helper to create a ModuleService instance for custom endpoints
async function createModuleService() {
  const apiUrl = await getApiDomain();
  
  let tenantId: string | undefined;
  let userSessionId: string | undefined;
  let userId: string | undefined;

  try {
    // Get session and user details
    const session = await getCurrentSession();
    const user = await getCurrentUser();
    
    tenantId = session?.tenantId;
    userSessionId = session?.id;
    userId = user?.id;
  } catch (error) {
    console.warn("Failed to get auth details:", error);
  }

  return new ModuleService(apiUrl, {
    tenantId,
    userSessionId,
    userId,
    appName: 'core' // Default app name
  });
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

    let result;

    // Handle special actions that require custom endpoints
    if (actionKey === 'resetPassword') {
      console.log(`🔐 RESET PASSWORD DEBUG: Starting password reset for user ${targetId}`);
      
      // For password reset, use the specific endpoint with PATCH method
      const moduleService = await createModuleService();
      
      // Prepare password reset data
      const resetData: any = {};
      const mode = formData.get("mode") as string;
      
      console.log(`🔐 RESET PASSWORD DEBUG: Mode = ${mode}`);
      
      if (mode === "custom") {
        const password = formData.get("password") as string;
        if (password) {
          resetData.password = password;
          console.log(`🔐 RESET PASSWORD DEBUG: Custom password provided (length: ${password.length})`);
        } else {
          console.log(`🔐 RESET PASSWORD DEBUG: Custom mode selected but no password provided`);
        }
      } else {
        console.log(`🔐 RESET PASSWORD DEBUG: Generate mode - sending empty body`);
      }
      // For "generate" mode, send empty body to let server generate password

      const endpoint = `/core/${moduleSlug}/${targetId}/reset-password`;
      console.log(`🔐 RESET PASSWORD DEBUG: Calling API endpoint: ${endpoint}`);
      console.log(`🔐 RESET PASSWORD DEBUG: Request body:`, resetData);
      console.log(`🔐 RESET PASSWORD DEBUG: Auth details:`, {
        tenantId: moduleService['tenantId'],
        userSessionId: moduleService['userSessionId'],
        userId: moduleService['userId']
      });

      // Make direct API call to reset password endpoint
      const response = await moduleService['httpClient'].request(
        endpoint, 
        {
          method: "PATCH",
          body: resetData,
          tenantId: moduleService['tenantId'],
          userSessionId: moduleService['userSessionId'],
          userId: moduleService['userId'],
          withAuth: true,
        }
      );

      console.log(`🔐 RESET PASSWORD DEBUG: API Response received:`, {
        success: response.success,
        status: response.status,
        error: response.error,
        data: response.data,
        hasNewPassword: !!response.data?.newPassword,
        newPassword: response.data?.newPassword ? '[REDACTED]' : undefined
      });

      if (!response.success) {
        console.error(`🔐 RESET PASSWORD DEBUG: API call failed:`, {
          error: response.error,
          status: response.status,
          details: response
        });
        throw new Error(response.error || "Failed to reset password");
      }

      console.log(`🔐 RESET PASSWORD DEBUG: API call successful`);
      result = response.data;
      
      // For password reset, preserve the generated password in the response
      if (response.data?.newPassword) {
        console.log(`🔐 RESET PASSWORD DEBUG: Generated password received from server`);
        result.newPassword = response.data.newPassword;
      } else {
        console.log(`🔐 RESET PASSWORD DEBUG: No generated password in response`);
      }
    } else if (actionKey === 'assignRoles') {
      console.log(`🎭 ASSIGN ROLES DEBUG: Starting role assignment for user ${targetId}`);
      
      // For role assignment, use the specific endpoint with PATCH method
      const moduleService = await createModuleService();
      
      // Prepare role assignment data
      const assignRolesData: any = {};
      const organizationId = formData.get("organizationId") as string;
      const departmentId = formData.get("departmentId") as string;
      const roleId = formData.get("roleId") as string;
      
      console.log(`🎭 ASSIGN ROLES DEBUG: Role assignment data`, {
        organizationId,
        departmentId,
        roleId
      });
      
      if (organizationId) {
        assignRolesData.organizationId = organizationId;
      }
      if (departmentId) {
        assignRolesData.departmentId = departmentId;
      }
      if (roleId) {
        assignRolesData.roleId = roleId;
      }

      const endpoint = `/core/${moduleSlug}/${targetId}/roles`;
      console.log(`🎭 ASSIGN ROLES DEBUG: Calling API endpoint: ${endpoint}`);
      console.log(`🎭 ASSIGN ROLES DEBUG: Request body:`, assignRolesData);

      // Make direct API call to assign roles endpoint using PUT method
      const response = await moduleService['httpClient'].request(
        endpoint, 
        {
          method: "PUT",
          body: assignRolesData,
          tenantId: moduleService['tenantId'],
          userSessionId: moduleService['userSessionId'],
          userId: moduleService['userId'],
          withAuth: true,
        }
      );

      console.log(`🎭 ASSIGN ROLES DEBUG: API Response received:`, {
        success: response.success,
        status: response.status,
        error: response.error,
        data: response.data
      });

      if (!response.success) {
        console.error(`🎭 ASSIGN ROLES DEBUG: API call failed:`, {
          error: response.error,
          status: response.status,
          details: response
        });
        throw new Error(response.error || "Failed to assign roles");
      }

      console.log(`🎭 ASSIGN ROLES DEBUG: API call successful`);
      result = response.data;
    } else {
      // Use standard PATCH method for other extra actions
      result = await updateModuleItem(moduleSlug, targetId, actionData);
    }

    // Revalidate the affected pages
    revalidatePath(`/${moduleSlug}`);
    revalidatePath(`/${moduleSlug}/[id]`, 'page');

    console.log(`🔐 RESET PASSWORD DEBUG: Final server action result:`, {
      success: true,
      message: result.message || "Action completed successfully",
      data: result,
      hasNewPassword: !!result?.newPassword,
      newPasswordLength: result?.newPassword?.length
    });

    return {
      success: true,
      message: result.message || "Action completed successfully",
      data: result,
    };

  } catch (error) {
    const actionKey = formData.get("actionKey") as string;
    const moduleSlug = formData.get("moduleSlug") as string;
    
    console.error(`💥 EXTRA ACTION ERROR: Failed to execute action "${actionKey}"`, {
      actionKey: actionKey,
      moduleSlug: moduleSlug,
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name
    });
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

