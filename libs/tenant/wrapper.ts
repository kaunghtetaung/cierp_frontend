// Server-side tenant wrapper following managementpanel patterns
import { cache } from "react";
import {
  getTenantSetting as getTenantSettingFromService,
  getTenantSettingClientSafe,
  validateTenant,
} from "./tenant-service";
import { getTenantIdFromHeaders } from "@repo/utils/server";
import type { TenantSettings, TenantSettingsDto } from "@repo/types";

/**
 * Get tenant settings with secrets (server-side only)
 * Uses React.cache for deduplication within the same request
 */
export async function getTenantWithSecrets(
  tenantId: string
): Promise<TenantSettingsDto | null> {
  try {
    const result = await getTenantSettingFromService(tenantId);
    return result;
  } catch (error) {
    console.error(
      `❌ getTenantWithSecrets: Failed to get tenant with secrets for ${tenantId}:`,
      error
    );
    return null;
  }
}

/**
 * Get current tenant from headers and return client-safe data
 * This is the main function used by the layout
 * Cached at request level to prevent multiple calls
 */
export const getCurrentTenantForClient = cache(
  async (): Promise<TenantSettings | null> => {
    try {
      const tenantId = await getTenantIdFromHeaders();

      if (!tenantId) {
        return null;
      }

      const tenantSettings = await getTenantSettingClientSafe(tenantId);

      return tenantSettings;
    } catch (error) {
      // Re-throw critical network errors that should be handled by root layout
      if (error instanceof Error) {
        if (
          error.message.includes("connection") ||
          error.message.includes("timeout") ||
          error.message.includes("server") ||
          error.message.includes("unavailable") ||
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("ENOTFOUND") ||
          error.message.includes('init["status"] must be in the range') ||
          error.message.includes("fetch failed") ||
          error.message.includes("Network Error") ||
          error.message.includes("Service Unavailable") ||
          error.message.includes("Gateway Exception")
        ) {
          throw error; // Re-throw critical errors
        }
      }

      // Return null for non-critical errors (e.g., tenant not found, invalid data, etc.)
      return null;
    }
  }
);

/**
 * Validate if tenant exists and is active
 */
export async function isTenantValid(tenantId: string): Promise<boolean> {
  try {
    return await validateTenant(tenantId);
  } catch (error) {
    return false;
  }
}

/**
 * Get tenant secrets for server-side operations (e.g., getting client credentials)
 * Only use this for server-side operations, never pass to client
 */
export async function getTenantSecrets(tenantId: string): Promise<any | null> {
  try {
    const tenantDto = await getTenantWithSecrets(tenantId);

    const secrets = tenantDto?.secret || null;

    return secrets;
  } catch (error) {
    return null;
  }
}

/**
 * Tenant wrapper object for server.ts compatibility
 */
export const tenantWrapper = {
  clearTenantCache: async (
    tenantId?: string,
    domain?: string
  ): Promise<void> => {
    // Clear tenant cache implementation
    const { clearTenantCache } = await import("./tenant-service");
    await clearTenantCache(tenantId);
  },

  refreshTenantCache: async (tenantId: string): Promise<void> => {
    // Refresh tenant cache by clearing it (next request will refetch)
    const { clearTenantCache } = await import("./tenant-service");
    await clearTenantCache(tenantId);
  },
};
