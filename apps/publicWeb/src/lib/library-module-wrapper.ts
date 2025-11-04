'use server';

import { cache } from "react";
import { getApiDomain } from "@repo/utils/server";
import { getCurrentUser, getCurrentSession } from "@repo/auth/server";
import { ModuleService, type ModuleListParams } from "@repo/app-modules";

/**
 * Helper to get headers safely
 */
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

/**
 * Create ModuleService instance for library module
 * Forces appName to 'library' to generate /library/{module} endpoints
 */
async function createLibraryServiceInstance() {
  const apiUrl = await getApiDomain();

  let tenantId: string | undefined;
  let userSessionId: string | undefined;
  let userId: string | undefined;

  try {
    const headerStore = await getHeaders();
    if (!headerStore) {
      console.warn("Headers not available, using fallback context");
      return new ModuleService(apiUrl, { appName: 'library' });
    }

    // Get tenantId from headers (middleware sets this)
    tenantId = headerStore.get("x-tenant-id") || undefined;

    // Get both session and user information
    const [session, user] = await Promise.all([
      getCurrentSession(headerStore as any),
      getCurrentUser(headerStore as any)
    ]);

    if (session && user) {
      // Authenticated user - use full context
      userSessionId = session.id;
      userId = (user as any).userId || user.id;
      tenantId = user.tenantId || session.tenantId || tenantId;
    } else if (session) {
      // Session only
      userSessionId = session.id;
      tenantId = session.tenantId || tenantId;
    }
    // No authentication - can still make API calls with tenantId (will use tenant/initializer tokens)

  } catch (error) {
    console.warn("Could not access headers during library service creation:", error);
  }

  console.log('📚 [LIBRARY WRAPPER] createLibraryServiceInstance:', {
    appName: 'library',
    tenantId,
    userSessionId,
    userId
  });

  // Force appName to 'library' for /library/{module} endpoints
  return new ModuleService(apiUrl, {
    tenantId,
    userSessionId,
    userId,
    appName: 'library',
  });
}

/**
 * Get library module list (bibliographies, news, etc.)
 */
export const getLibraryModuleList = cache(
  async <T = any>(
    module: string,
    params: ModuleListParams = {}
  ): Promise<{ data: T[]; pagination?: any }> => {
    console.log("🎯 [LIBRARY WRAPPER] getLibraryModuleList called");
    console.log("   Module:", module);
    console.log("   Params:", JSON.stringify(params, null, 2));

    const moduleService = await createLibraryServiceInstance();
    return await moduleService.getList<T>(module, params);
  }
);

/**
 * Get a single library module item by ID
 */
export const getLibraryModuleItem = cache(
  async <T = any>(module: string, id: string): Promise<T> => {
    const moduleService = await createLibraryServiceInstance();
    return await moduleService.getItem<T>(module, id);
  }
);

/**
 * Get library reference data for dropdowns
 */
export const getLibraryModuleReference = cache(
  async <T = any>(
    module: string,
    queryParams?: Record<string, string>
  ): Promise<T[]> => {
    const moduleService = await createLibraryServiceInstance();
    return await moduleService.getReference<T>(module, queryParams);
  }
);
