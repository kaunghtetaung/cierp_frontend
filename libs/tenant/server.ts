// Server-side tenant resolution following managementpanel patterns
import { cache } from "react";
import { tenantWrapper } from "./wrapper";
import { getTenantSettingClientSafe, validateTenant } from "./tenant-service";
import type { TenantSettings } from "@repo/types";
import { getApiEndpoint, buildTenantApiUrl } from "../utils/common/url";

// Server-side validation function (inline until utils package is available)
function isValidTenantId(tenantId: string): boolean {
  return (
    typeof tenantId === "string" &&
    tenantId.length > 0 &&
    /^[a-zA-Z0-9-_]+$/.test(tenantId)
  );
}

// Server-side domain validation function
function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
  return domainRegex.test(domain) && domain.length <= 253;
}

export interface TenantResolverConfig {
  readonly allowedDomains?: string[];
  readonly enableDomainValidation?: boolean;
}

const DEFAULT_CONFIG: TenantResolverConfig = {
  allowedDomains: process.env.ALLOWED_DOMAINS?.split(",") || [],
  enableDomainValidation: true,
};


/**
 * Resolve tenant by domain - calls tenant/initialize API endpoint
 * This follows managementpanel pattern: hostname → API call → tenant ID
 * @throws {Error} "Invalid organization" if tenant cannot be resolved
 */
export const resolveTenantByDomain = cache(
  async (
    domain: string,
    apiBaseUrl?: string,
    config: Partial<TenantResolverConfig> = {}
  ): Promise<string> => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    console.log("🔎 resolveTenantByDomain called:", {
      domain,
      apiBaseUrl,
      config: finalConfig,
    });

    // Validate domain format
    if (finalConfig.enableDomainValidation && !isValidDomain(domain)) {
      console.error("Invalid domain format:", domain);
      throw new Error("Invalid organization");
    }

    try {
      // Use common URL building function if no explicit apiBaseUrl provided
      let apiUrl: string;
      if (apiBaseUrl) {
        apiUrl = `${apiBaseUrl}/tenant/initialize?host=${encodeURIComponent(domain)}`;
      } else {
        // Use dynamic URL generation - detect protocol from environment
        const protocol = process.env.NODE_ENV === 'development' && !process.env.FORCE_HTTPS ? 'http' : 'https';
        apiUrl = buildTenantApiUrl(domain, protocol);
      }

      console.log("Making API call to:", apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "NextJS-App/1.0",
        },
        next: {
          revalidate: 300, // 5 minutes cache for Next.js
        },
      });

      console.log("API Response status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.error("Tenant not found (404) for domain:", domain);
          throw new Error("Invalid organization");
        }

        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Tenant resolve API error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        throw new Error(
          `Tenant resolve failed: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();
      console.log("API Response data:", responseData);

      // Extract tenant ID from response (managementpanel pattern)
      const tenantId = responseData.id || responseData.tenantId;

      if (!tenantId) {
        console.error("No tenant ID in response");
        throw new Error("Invalid organization");
      }

      // Validate tenant ID
      if (!isValidTenantId(tenantId)) {
        console.error("Invalid tenant ID format:", tenantId);
        throw new Error("Invalid organization");
      }

      console.log(
        "✅ Successfully resolved tenant ID for domain:",
        domain,
        "→",
        tenantId
      );
      return tenantId;
    } catch (error) {
      console.error("❌ Error resolving tenant:", error);

      // If it's already our "Invalid organization" error, rethrow it
      if (error instanceof Error && error.message === "Invalid organization") {
        throw error;
      }

      // For other errors (network, timeout, etc.), also throw Invalid organization
      throw new Error("Invalid organization");
    }
  }
);

/**
 * Get current tenant from headers (set by middleware)
 * This follows managementpanel pattern: middleware sets x-tenant-id header
 */
export const getCurrentTenant = cache(
  async (
    requestHeaders?: Record<string, string>
  ): Promise<TenantSettings | null> => {
    try {
      // Check for tenant ID in provided headers
      const tenantId = requestHeaders?.["x-tenant-id"] || null;

      if (!tenantId) {
        console.log("No tenant ID in headers or environment");
        return null;
      }

      // Use wrapper to get clean tenant settings (without secrets)
      return await getTenantSettingClientSafe(tenantId);
    } catch (error) {
      console.error("Error getting current tenant:", error);
      return null;
    }
  }
);

/**
 * Get current tenant ID from headers
 */
export const getCurrentTenantId = cache(
  async (requestHeaders?: Record<string, string>): Promise<string | null> => {
    try {
      // Check for tenant ID in provided headers
      const tenantId = requestHeaders?.["x-tenant-id"] || null;
      return tenantId;
    } catch (error) {
      console.error("Error getting current tenant ID:", error);
      return null;
    }
  }
);

/**
 * Require tenant (throws if not found)
 */
export async function requireTenant(
  requestHeaders?: Record<string, string>
): Promise<TenantSettings> {
  const tenant = await getCurrentTenant(requestHeaders);

  if (!tenant) {
    throw new Error("Tenant required but not found");
  }

  return tenant;
}

/**
 * Require tenant ID (throws if not found)
 */
export async function requireTenantId(
  requestHeaders?: Record<string, string>
): Promise<string> {
  const tenantId = await getCurrentTenantId(requestHeaders);

  if (!tenantId) {
    throw new Error("Tenant ID required but not found");
  }

  return tenantId;
}

/**
 * Check if tenant is active
 */
export async function isTenantActive(
  tenantId?: string,
  requestHeaders?: Record<string, string>
): Promise<boolean> {
  const finalTenantId = tenantId || (await getCurrentTenantId(requestHeaders));

  if (!finalTenantId) {
    return false;
  }

  // Use validateTenant function which properly checks isActive from the DTO
  return await validateTenant(finalTenantId);
}

/**
 * Get tenant applications
 */
export async function getTenantApplications(
  tenantId?: string,
  requestHeaders?: Record<string, string>
): Promise<TenantSettings["applications"]> {
  const finalTenantId = tenantId || (await getCurrentTenantId(requestHeaders));

  if (!finalTenantId) {
    return [];
  }

  const tenant = await getTenantSettingClientSafe(finalTenantId);
  return tenant?.applications || [];
}

/**
 * Create tenant cookie header (used by middleware)
 */
export function createTenantCookieHeader(
  tenantId: string,
  domain: string,
  maxAge: number = 24 * 60 * 60 // 24 hours
): string {
  // Simple cookie creation (replace with proper cookie lib when security package is available)
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  return `x-tenant-id=${tenantId}; Domain=${domain}; Path=/; Expires=${expires}; HttpOnly; Secure; SameSite=Lax`;
}

/**
 * Clear tenant cache - delegates to wrapper
 */
export async function clearTenantCache(
  tenantId?: string,
  domain?: string
): Promise<void> {
  await tenantWrapper.clearTenantCache(tenantId, domain);
}

/**
 * Refresh tenant cache - delegates to wrapper
 */
export async function refreshTenantCache(tenantId: string): Promise<void> {
  await tenantWrapper.refreshTenantCache(tenantId);
}

/**
 * Helper for middleware to resolve tenant by hostname and get API URL
 * @throws {Error} "Invalid organization" if tenant cannot be resolved
 */
export async function resolveTenantForMiddleware(hostname: string): Promise<{
  tenantId: string;
  apiEndpoint: {
    fullUrl: string;
    rootDomain: string;
  };
}> {
  const apiEndpoint = getApiEndpoint(hostname);
  const tenantId = await resolveTenantByDomain(hostname, apiEndpoint.fullUrl);

  return {
    tenantId,
    apiEndpoint,
  };
}
