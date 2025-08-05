import { cache } from "react";

// Conditional import for next/headers to avoid client-side errors
const getHeaders = async () => {
  if (typeof window !== 'undefined') {
    return {
      get: (name: string) => {
        if (name === 'host') return window.location.host;
        if (name === 'x-lang') return localStorage.getItem('language') || 'en';
        return null;
      }
    };
  }
  
  try {
    const { headers } = await import('next/headers');
    return await headers();
  } catch (error) {
    return { get: () => null };
  }
};
import { getApiDomain } from "@repo/utils/server";
import { getCurrentUser, getCurrentSession } from "@repo/auth/server";
import { ModuleService } from "./module-service";
import type {
  ModuleListParams,
  BulkOperationParams,
  ExtraActionParams,
} from "./types";

/**
 * Helper to create a ModuleService instance with required auth details.
 */
async function createServiceInstance() {
  const apiUrl = await getApiDomain();
  
  let tenantId: string | undefined;
  let userSessionId: string | undefined;
  let userId: string | undefined;
  let appName: string | undefined;

  try {
    const headerStore = await getHeaders();
    if (!headerStore) {
      console.warn("Headers not available, using fallback context");
      return new ModuleService(apiUrl, {});
    }

    // Get tenantId and appName from headers first (middleware sets these)
    tenantId = headerStore.get("x-tenant-id") || undefined;
    appName = headerStore.get("x-app-id") || undefined;

    // Get both session and user information
    const [session, user] = await Promise.all([
      getCurrentSession(headerStore),
      getCurrentUser(headerStore)
    ]);
    
    if (session && user) {
      // Authenticated user - use full context
      userSessionId = session.id;
      userId = user.userId || user.id;  // Use userId for token lookup
      tenantId = user.tenantId || session.tenantId || tenantId;
    } else if (session) {
      // Session only
      userSessionId = session.id;
      tenantId = session.tenantId || tenantId;
    } else {
      // No authentication - can still make API calls with tenantId (will use tenant/initializer tokens)
    }

  } catch (error) {
    console.warn("Could not access headers during service creation:", error);
    // Continue with undefined context - TokenManager will handle appropriately
  }

  // Pass authentication context to ModuleService
  const options = {
    tenantId,
    userSessionId,
    userId,
    appName,
  };

  return new ModuleService(apiUrl, options);
}

/**
 * Get module list using React.cache for request-level deduplication.
 */
export const getModuleList = cache(
  async <T = any>(
    module: string,
    params: ModuleListParams = {}
  ): Promise<T[]> => {
    const moduleService = await createServiceInstance();
    return await moduleService.getList<T>(module, params);
  }
);

/**
 * Get a single module item by ID using React.cache.
 */
export const getModuleItem = cache(
  async <T = any>(module: string, id: string): Promise<T> => {
    const moduleService = await createServiceInstance();
    return await moduleService.getItem<T>(module, id);
  }
);

/**
 * Create a new module item.
 */
export async function createModuleItem<T = any>(
  module: string,
  data: any
): Promise<T> {
  const moduleService = await createServiceInstance();
  return await moduleService.create<T>(module, data);
}

/**
 * Update an existing module item.
 */
export async function updateModuleItem<T = any>(
  module: string,
  id: string,
  data: any
): Promise<T> {
  const moduleService = await createServiceInstance();
  return await moduleService.update<T>(module, id, data);
}

/**
 * Delete a module item.
 */
export async function deleteModuleItem<T = any>(
  module: string,
  id: string
): Promise<T> {
  const moduleService = await createServiceInstance();
  return await moduleService.delete<T>(module, id);
}

/**
 * Perform bulk operations on module items.
 */
export async function bulkModuleOperation<T = any>(
  module: string,
  params: BulkOperationParams
): Promise<T> {
  const moduleService = await createServiceInstance();
  return await moduleService.bulkOperation<T>(module, params);
}

/**
 * Execute a custom extra action on a module item.
 */
export async function executeModuleExtraAction<T = any>(
  module: string,
  params: ExtraActionParams
): Promise<T> {
  const moduleService = await createServiceInstance();
  return await moduleService.executeExtraAction<T>(module, params);
}

/**
 * Get reference data for dropdowns using React.cache for request-level deduplication.
 */
export const getModuleReference = cache(
  async <T = any>(
    module: string,
    queryParams?: Record<string, string>
  ): Promise<T[]> => {
    const moduleService = await createServiceInstance();
    return await moduleService.getReference<T>(module, queryParams);
  }
);
