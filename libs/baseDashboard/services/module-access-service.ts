// Module Access Service - Server-side module filtering with user permissions
import { cache } from 'react';
import { getModuleSchemas } from '@repo/appSchema/wrapper';
import { filterModulesByUserAccess } from '../../../apps/core/src/lib/module-access-utils';
import type { ModuleSchema, User, TenantApplication } from '@repo/types';

/**
 * Interface for app with accessible modules
 */
export interface AppWithModules extends TenantApplication {
  accessibleModules: ModuleSchema[];
  moduleCount: number;
  hasModuleAccess: boolean;
}

/**
 * Get modules for a specific app with user access filtering
 * Cached at request level for performance
 */
export const getAppModulesWithAccess = cache(
  async (user: User | null, appId: string, tenantId: string): Promise<ModuleSchema[]> => {
    try {
      console.log(`[MODULE_ACCESS_SERVICE] Fetching modules for app: ${appId}, tenant: ${tenantId}`);

      // Get all modules for the app
      const allModules = await getModuleSchemas(tenantId, appId);

      if (!allModules || allModules.length === 0) {
        console.log(`[MODULE_ACCESS_SERVICE] No modules found for app: ${appId}`);
        return [];
      }

      // Filter modules based on user access permissions
      const accessibleModules = filterModulesByUserAccess(allModules, user);

      console.log(
        `[MODULE_ACCESS_SERVICE] App ${appId}: ${accessibleModules.length}/${allModules.length} modules accessible`
      );

      return accessibleModules;
    } catch (error) {
      console.error(`[MODULE_ACCESS_SERVICE] Error fetching modules for app ${appId}:`, error);
      return [];
    }
  }
);

/**
 * Enhance apps with module access information
 * Returns apps with their accessible modules and counts
 */
export const enhanceAppsWithModuleAccess = cache(
  async (
    apps: TenantApplication[],
    user: User | null,
    tenantId: string
  ): Promise<AppWithModules[]> => {
    if (!apps || apps.length === 0) {
      return [];
    }

    console.log(`[MODULE_ACCESS_SERVICE] Enhancing ${apps.length} apps with module access`);

    // Process all apps in parallel for better performance
    const enhancedApps = await Promise.all(
      apps.map(async (app): Promise<AppWithModules> => {
        // Use app slug or displayShortName.en as the service name
        const appServiceName = app.slug || (app.displayShortName as any)?.en || app.slug;

        if (!appServiceName) {
          console.warn(`[MODULE_ACCESS_SERVICE] No service name found for app:`, app);
          return {
            ...app,
            accessibleModules: [],
            moduleCount: 0,
            hasModuleAccess: false
          };
        }

        const accessibleModules = await getAppModulesWithAccess(user, appServiceName, tenantId);

        return {
          ...app,
          accessibleModules,
          moduleCount: accessibleModules.length,
          hasModuleAccess: accessibleModules.length > 0
        };
      })
    );

    console.log(
      `[MODULE_ACCESS_SERVICE] Enhanced apps with module counts:`,
      enhancedApps.map(app => ({
        app: app.slug || app.displayShortName,
        modules: app.moduleCount,
        hasAccess: app.hasModuleAccess
      }))
    );

    return enhancedApps;
  }
);

/**
 * Check if user has access to any modules in a specific app
 * Lightweight check for quick validation
 */
export const hasAnyModuleAccess = cache(
  async (user: User | null, appId: string, tenantId: string): Promise<boolean> => {
    const accessibleModules = await getAppModulesWithAccess(user, appId, tenantId);
    return accessibleModules.length > 0;
  }
);

/**
 * Get module access summary for all apps
 * Useful for debugging and logging
 */
export const getModuleAccessSummary = cache(
  async (apps: TenantApplication[], user: User | null, tenantId: string) => {
    const enhancedApps = await enhanceAppsWithModuleAccess(apps, user, tenantId);

    return {
      totalApps: apps.length,
      appsWithAccess: enhancedApps.filter(app => app.hasModuleAccess).length,
      moduleAccessDetails: enhancedApps.map(app => ({
        appId: app.slug || app.displayShortName,
        moduleCount: app.moduleCount,
        hasAccess: app.hasModuleAccess,
        modules: app.accessibleModules.map(module => module.slug)
      }))
    };
  }
);

/**
 * Validate module access for app switching
 * Returns validation result with fallback suggestions
 */
export interface ModuleAccessValidation {
  hasAccess: boolean;
  accessibleModules: ModuleSchema[];
  fallbackModule?: ModuleSchema;
  message?: string;
}

export const validateAppModuleAccess = cache(
  async (
    user: User | null,
    appId: string,
    tenantId: string,
    requestedModule?: string
  ): Promise<ModuleAccessValidation> => {
    const accessibleModules = await getAppModulesWithAccess(user, appId, tenantId);

    if (accessibleModules.length === 0) {
      return {
        hasAccess: false,
        accessibleModules: [],
        message: `No accessible modules found for app: ${appId}`
      };
    }

    // If specific module requested, check if user has access
    if (requestedModule) {
      const hasRequestedModuleAccess = accessibleModules.some(
        module => module.slug === requestedModule
      );

      if (!hasRequestedModuleAccess) {
        return {
          hasAccess: false,
          accessibleModules,
          fallbackModule: accessibleModules[0], // Suggest first accessible module
          message: `No access to module '${requestedModule}' in app '${appId}'. Suggesting fallback.`
        };
      }
    }

    return {
      hasAccess: true,
      accessibleModules,
      fallbackModule: accessibleModules[0] // Default entry point
    };
  }
);