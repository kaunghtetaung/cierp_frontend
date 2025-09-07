// Tenant service with React.cache as single source of truth and unified cache
import { cache } from "react";
import { getApiDomain } from "@repo/utils/server";
import { createHttpClient } from "@repo/api/client";
import { getCacheInstance, CacheKeys, CacheTTL } from "@repo/cache";
import type { TenantSettingsDto, TenantSettings, ApiResponse } from "@repo/types";

export class TenantService {
  private httpClient;
  private cache = getCacheInstance();

  constructor(baseURL: string) {
    this.httpClient = createHttpClient({
      baseURL,
      enableAuth: true,
      enableCSRF: false, // Tenant API doesn't need CSRF
      timeout: 10000 // 10 second timeout for server requests
    });
  }

  /**
   * Get tenant settings with proper authentication and caching
   * Uses direct get/set to avoid nested cache calls with TokenManager
   */
  async getSettings(tenantId: string): Promise<TenantSettingsDto> {
    console.log("\n💾 === TENANT SERVICE GET SETTINGS DEBUG START ===");
    console.log("💾 Step 1: Getting settings for tenant:", tenantId);
    
    const cacheKey = CacheKeys.tenantSettings(tenantId);
    console.log("💾 Step 2: Cache key:", cacheKey);

    // Try to get from cache first
    const cachedTenant = await this.cache.get<TenantSettingsDto>(cacheKey);
    if (cachedTenant) {
      console.log("💾 Step 3: Found in cache, returning cached data");
      console.log("💾 === TENANT SERVICE GET SETTINGS DEBUG END (CACHED) ===\n");
      return cachedTenant;
    }

    console.log("💾 Step 3: Not in cache, fetching from API");
    const startTime = Date.now();
    
    // If not in cache, fetch from API using HTTP client
    const response: ApiResponse<TenantSettingsDto> = await this.httpClient.get(
      `/tenant/settings`,
      { id: tenantId }
    );
    
    const fetchTime = Date.now() - startTime;
    console.log(`💾 Step 4: API fetch completed in ${fetchTime}ms`);
    console.log("💾 Step 5: API response success:", response.success);

    if (!response.success) {
      console.error("💾 Step ERROR: API fetch failed:", response.error);
      console.log("💾 === TENANT SERVICE GET SETTINGS DEBUG END (ERROR) ===\n");
      throw new Error(response.error || 'Failed to fetch tenant settings');
    }

    const tenantData = response.data;
    console.log("💾 Step 6: Got tenant data, caching it");

    // Cache the result
    await this.cache.set(cacheKey, tenantData, CacheTTL.TENANT_SETTINGS);
    console.log("💾 Step 7: Data cached successfully");
    console.log("💾 === TENANT SERVICE GET SETTINGS DEBUG END (SUCCESS) ===\n");

    return tenantData;
  }

  /**
   * Transform tenant settings to client-safe format (remove secrets)
   */
  transformToClientSafe(tenantDto: TenantSettingsDto): TenantSettings {
    // Remove secrets from the DTO
    const { secret, ...clientSafeData } = tenantDto;
    return clientSafeData;
  }
}

/**
 * Get tenant settings using React.cache for request-level deduplication
 * This is the single source of truth for tenant settings
 */
export const getTenantSetting = cache(
  async (tenantId: string): Promise<TenantSettingsDto> => {
    const baseURL = await getApiDomain();
    const tenantService = new TenantService(baseURL);

    console.log(
      `🏢 Fetching tenant settings for: ${tenantId} from: ${baseURL}`
    );

    return await tenantService.getSettings(tenantId);
  }
);

/**
 * Get client-safe tenant settings (without secrets)
 * Uses React.cache for deduplication
 */
export const getTenantSettingClientSafe = cache(
  async (tenantId: string): Promise<TenantSettings> => {
    const baseURL = await getApiDomain();
    const tenantService = new TenantService(baseURL);

    // Get full tenant data
    const tenantDto = await getTenantSetting(tenantId);

    // Transform to client-safe format
    return tenantService.transformToClientSafe(tenantDto);
  }
);

/**
 * Validate tenant exists and is active
 */
export const validateTenant = cache(
  async (tenantId: string): Promise<boolean> => {
    try {
      const tenantSettings = await getTenantSetting(tenantId);
      return (tenantSettings as any).isActive ?? true;
    } catch (error) {
      console.error(`Failed to validate tenant ${tenantId}:`, error);
      return false;
    }
  }
);

/**
 * Get tenant settings by domain (for middleware)
 * Uses direct get/set to avoid nested cache calls
 */
export const getTenantByDomain = cache(
  async (domain: string): Promise<TenantSettingsDto | null> => {
    const cache = getCacheInstance();
    const cacheKey = CacheKeys.custom("TenantByDomain", domain);

    try {
      // Try to get from cache first
      const cachedDomain = await cache.get<TenantSettingsDto>(cacheKey);
      if (cachedDomain) {
        return cachedDomain;
      }

      // If not in cache, resolve domain to tenant
      const baseURL = await getApiDomain();
      const httpClient = createHttpClient({
        baseURL,
        enableAuth: true,
        enableCSRF: false
      });

      const response: ApiResponse<{ id?: string; tenantId?: string }> = await httpClient.get(
        `/tenant/initialize`,
        { host: domain }
      );

      if (!response.success) {
        if (response.error?.includes('not found') || response.error?.includes('404')) {
          return null; // Tenant not found
        }
        throw new Error(response.error || 'Failed to resolve tenant by domain');
      }

      const tenantId = response.data.id || response.data.tenantId;

      if (!tenantId) {
        return null;
      }

      // Get full tenant settings using the cached version
      const tenantSettings = await getTenantSetting(tenantId);

      // Cache the domain -> tenant mapping
      if (tenantSettings) {
        await cache.set(cacheKey, tenantSettings, CacheTTL.TENANT_SETTINGS);
      }

      return tenantSettings;
    } catch (error) {
      console.error(`Failed to get tenant by domain ${domain}:`, error);
      return null;
    }
  }
);

/**
 * Clear tenant cache (useful for testing or manual refresh)
 */
export async function clearTenantCache(tenantId?: string): Promise<void> {
  const cache = getCacheInstance();

  if (tenantId) {
    // Clear specific tenant cache
    const patterns = [
      CacheKeys.tenantSettings(tenantId),
      CacheKeys.custom("TenantByDomain", "*"), // Clear domain mappings
    ];

    for (const pattern of patterns) {
      await cache.deletePattern(pattern);
    }

    console.log(`Tenant cache cleared for: ${tenantId}`);
  } else {
    // Clear all tenant-related cache
    const patterns = ["ciApp:*:TenantSettings", "ciApp:TenantByDomain:*"];

    for (const pattern of patterns) {
      await cache.deletePattern(pattern);
    }

    console.log("All tenant cache cleared");
  }
}
