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
  debugInfo?: {
    url?: string;
    method?: string;
    requestBody?: any;
    response?: any;
    error?: string;
    timestamp?: string;
  };
}

// Helper to infer appName from module slug
function inferAppNameFromModule(moduleSlug: string): string {
  // Library-related modules
  const libraryModules = ['borrowers', 'bibliographies', 'accession-groups', 'catalog-types', 'authors', 'publishers', 'subjects', 'degrees', 'languages'];

  if (libraryModules.includes(moduleSlug)) {
    return 'library';
  }

  // Default to 'core' for other modules (users, roles, departments, etc.)
  return 'core';
}

// Helper to create a ModuleService instance for custom endpoints
async function createModuleService(appName?: string) {
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
    appName: appName || 'core' // Use provided appName or default to 'core'
  });
}

export async function executeExtraAction(formData: FormData): Promise<ExtraActionResult> {
  try {
    // Debug: Log all form data entries
    console.log("📋 executeExtraAction: All form data entries:");
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    // Support both actionKey and actionId for backwards compatibility
    const actionKey = (formData.get("actionKey") || formData.get("actionId")) as string;
    const moduleSlug = formData.get("moduleSlug") as string;
    const id = formData.get("id") as string;
    const selectedIds = formData.getAll("selectedIds") as string[];
    const appName = (formData.get("appName") as string) || undefined; // Get appName from formData if provided

    console.log("📋 executeExtraAction: Parsed values:", {
      actionKey,
      moduleSlug,
      id,
      selectedIds,
      appName
    });

    if (!actionKey) {
      throw new Error(`Missing required action parameter: actionKey or actionId. Got actionKey=${formData.get("actionKey")}, actionId=${formData.get("actionId")}`);
    }
    
    if (!moduleSlug) {
      throw new Error(`Missing required action parameter: moduleSlug. Got moduleSlug=${formData.get("moduleSlug")}`);
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
      // Exclude all metadata fields and internal form fields
      if (!["actionKey", "actionId", "moduleSlug", "id", "selectedIds", "action", "appName"].includes(key)) {
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
      // For password reset, use the specific endpoint with PATCH method
      const moduleService = await createModuleService();
      
      // Prepare password reset data
      const resetData: any = {};
      const mode = formData.get("mode") as string;

      if (mode === "custom") {
        const password = formData.get("password") as string;
        if (password) {
          resetData.password = password;
        }
      }
      // For "generate" mode, send empty body to let server generate password

      // Build endpoint - use the moduleSlug as the resource name (e.g., "users")
      const appName = 'core'; // TODO: This should come from config or context
      const endpoint = `/${appName}/${moduleSlug}/${targetId}/reset-password`;

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

      if (!response.success) {
        console.error("Failed to reset password:", response.error);
        throw new Error(response.error || "Failed to reset password");
      }

      result = response.data;

      // For password reset, preserve the generated password in the response
      if (response.data?.newPassword) {
        result.newPassword = response.data.newPassword;
      }
    } else if (actionKey === 'assignRoles') {
      // For role assignment, use the specific endpoint with PATCH method
      const moduleService = await createModuleService();
      
      // Prepare role assignment data
      const assignRolesData: any = {};
      const organizationId = formData.get("organizationId") as string;
      const departmentId = formData.get("departmentId") as string;
      const roleId = formData.get("roleId") as string;

      if (organizationId) {
        assignRolesData.organizationId = organizationId;
      }
      if (departmentId) {
        assignRolesData.departmentId = departmentId;
      }
      if (roleId) {
        assignRolesData.roleId = roleId;
      }

      // Build endpoint - use the moduleSlug as the resource name (e.g., "users")
      const appName = 'core'; // TODO: This should come from config or context
      const endpoint = `/${appName}/${moduleSlug}/${targetId}/roles`;

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

      if (!response.success) {
        console.error("Failed to assign roles:", response.error);
        throw new Error(response.error || "Failed to assign roles");
      }

      result = response.data;
    } else {
      // Use ModuleService executeExtraAction (POST method) for extra actions
      // Determine appName: if not provided, infer from module slug
      const inferredAppName = appName || inferAppNameFromModule(moduleSlug);
      const moduleService = await createModuleService(inferredAppName);
      const apiUrl = await getApiDomain();
      const endpoint = `/${inferredAppName}/${moduleSlug}/${targetId}/${actionKey}`;
      const fullUrl = `${apiUrl}${endpoint}`;

      console.log('================================');
      console.log('📡 [extra-actions] HTTP REQUEST DETAILS');
      console.log('================================');
      console.log('🌐 Full URL:', fullUrl);
      console.log('📍 Endpoint:', endpoint);
      console.log('🔧 Method:', 'POST');
      console.log('🏢 Tenant ID:', moduleService['tenantId']);
      console.log('👤 User Session ID:', moduleService['userSessionId']);
      console.log('🆔 User ID:', moduleService['userId']);
      console.log('📦 Request Body:', JSON.stringify(actionData, null, 2));
      console.log('================================');

      const response = await moduleService['httpClient'].request(
        endpoint,
        {
          method: "POST",
          body: actionData,
          tenantId: moduleService['tenantId'],
          userSessionId: moduleService['userSessionId'],
          userId: moduleService['userId'],
          withAuth: true,
        }
      );

      console.log('================================');
      console.log('📥 [extra-actions] HTTP RESPONSE DETAILS');
      console.log('================================');
      console.log('✅ Success:', response.success);
      console.log('📊 Status:', response.status);
      console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
      console.log('❌ Error:', response.error || 'None');
      console.log('================================');

      if (!response.success) {
        throw new Error(response.error || `Failed to execute ${actionKey}`);
      }

      result = response.data;

      // Revalidate the affected pages
      revalidatePath(`/${moduleSlug}`);
      revalidatePath(`/${moduleSlug}/[id]`, 'page');

      return {
        success: true,
        message: result.message || "Action completed successfully",
        data: result,
        debugInfo: {
          url: fullUrl,
          method: 'POST',
          requestBody: actionData,
          response: response.data,
          timestamp: new Date().toISOString(),
        }
      };
    }

    // Revalidate the affected pages (for special actions)
    revalidatePath(`/${moduleSlug}`);
    revalidatePath(`/${moduleSlug}/[id]`, 'page');

    return {
      success: true,
      message: result.message || "Action completed successfully",
      data: result,
    };

  } catch (error) {
    const actionKey = formData.get("actionKey") as string;
    const moduleSlug = formData.get("moduleSlug") as string;
    const id = formData.get("id") as string;
    const formAppName = (formData.get("appName") as string) || undefined;
    console.error(`Failed to execute action "${actionKey}":`, error);

    const actionData: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (!["actionKey", "actionId", "moduleSlug", "id", "selectedIds", "action", "appName"].includes(key)) {
        actionData[key] = value;
      }
    }

    const apiUrl = await getApiDomain();
    const inferredAppName = formAppName || inferAppNameFromModule(moduleSlug);
    const endpoint = `/${inferredAppName}/${moduleSlug}/${id}/${actionKey}`;
    const fullUrl = `${apiUrl}${endpoint}`;

    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      debugInfo: {
        url: fullUrl,
        method: 'POST',
        requestBody: actionData,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }
    };
  }
}

