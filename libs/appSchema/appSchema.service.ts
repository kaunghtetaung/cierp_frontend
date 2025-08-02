// AppSchema service - Read-only API for Core module schemas and initialization
// Used for Next.js server-side to fetch module configurations from /core/initialize endpoint
import { cache } from "react";
import { getApiDomain } from "@repo/utils/server";
import { createHttpClient } from "@repo/api/client";
import { getCacheInstance, CacheKeys, CacheTTL } from "@repo/cache";
import type { ApiResponse } from "@repo/types";
import type {
  InitializeResponseDto,
  ModuleSchema,
  SupportedLanguage,
  CoreModuleName,
} from "@repo/types";
import {
  isInitializeResponse,
  findModuleBySlug,
  getModulesByService as getModulesByServiceUtil,
  getLocalizedText,
} from "@repo/types";

export class AppSchemaService {
  private httpClient;
  private cache = getCacheInstance();

  constructor(baseURL: string) {
    this.httpClient = createHttpClient({
      baseURL,
      enableAuth: true,
      enableCSRF: false, // Core initialize API doesn't need CSRF
      timeout: 15000, // 15 second timeout for server requests
    });
  }

  /**
   * Get module schemas from Core initialize endpoint (read-only)
   * This is the main method for fetching all module schemas
   */
  async initialize(
    tenantId: string,
    serviceName: string
  ): Promise<InitializeResponseDto> {
    const cacheKey = CacheKeys.appInitialize(serviceName, tenantId);

    // Try to get from cache first
    const cachedResponse = await this.cache.get<InitializeResponseDto>(
      cacheKey
    );
    if (cachedResponse && this.isValidInitializeResponse(cachedResponse)) {
      return cachedResponse;
    }

    // Fetch from API using HTTP client with tenant context
    const response: ApiResponse<InitializeResponseDto> =
      await this.httpClient.request(`/${serviceName}/initialize`, {
        method: "GET",
        tenantId,
        withAuth: true,
      });

    if (!response.success) {
      throw new Error(
        response.error ||
          "Failed to fetch module schemas from initialize endpoint"
      );
    }

    const initializeData = response.data;

    // Validate and cache the result
    if (this.isValidInitializeResponse(initializeData)) {
      await this.cache.set(
        cacheKey,
        initializeData,
        CacheTTL.LONG || 60 * 60 * 24
      );
      return initializeData;
    }

    throw new Error("Invalid initialize response data structure");
  }

  /**
   * Validate that initialize response data is complete and valid
   */
  private isValidInitializeResponse(data: any): data is InitializeResponseDto {
    return (
      isInitializeResponse(data) &&
      !!data.modules &&
      data.modules.length > 0 &&
      !!data.serviceName &&
      !!data.timestamp &&
      !!data.supportedLanguages &&
      data.supportedLanguages.length > 0
    );
  }

  /**
   * Get all module schemas
   */
  async getModules(
    tenantId: string,
    serviceName: string
  ): Promise<ModuleSchema[]> {
    const initData = await this.initialize(tenantId, serviceName);
    return Array.from(initData.modules);
  }

  /**
   * Get module schema by slug
   */
  async getModuleBySlug(
    tenantId: string,
    slug: string,
    serviceName: string
  ): Promise<ModuleSchema | undefined> {
    const modules = await this.getModules(tenantId, serviceName);
    return findModuleBySlug(modules, slug);
  }

  /**
   * Get modules by service name
   */
  async getModulesByService(
    tenantId: string,
    serviceName: string,
    filterServiceName: string
  ): Promise<ModuleSchema[]> {
    const modules = await this.getModules(tenantId, serviceName);
    return getModulesByServiceUtil(modules, filterServiceName);
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(
    tenantId: string,
    serviceName: string
  ): Promise<SupportedLanguage[]> {
    const initData = await this.initialize(tenantId, serviceName);
    return Array.from(initData.supportedLanguages);
  }

  /**
   * Get service name
   */
  async getServiceName(tenantId: string, serviceName: string): Promise<string> {
    const initData = await this.initialize(tenantId, serviceName);
    return initData.serviceName;
  }

  /**
   * Get timestamp of last update
   */
  async getLastUpdated(tenantId: string, serviceName: string): Promise<string> {
    const initData = await this.initialize(tenantId, serviceName);
    return initData.timestamp;
  }

  /**
   * Check if a module exists
   */
  async hasModule(tenantId: string, slug: string, serviceName: string): Promise<boolean> {
    const module = await this.getModuleBySlug(tenantId, slug, serviceName);
    return !!module;
  }

  /**
   * Get module form fields by slug
   */
  async getModuleFormFields(tenantId: string, slug: string, serviceName: string) {
    const module = await this.getModuleBySlug(tenantId, slug, serviceName);
    return module?.formFields || [];
  }

  /**
   * Get module table schema by slug
   */
  async getModuleTableSchema(tenantId: string, slug: string, serviceName: string) {
    const module = await this.getModuleBySlug(tenantId, slug, serviceName);
    return module?.dataTableSchema;
  }

  /**
   * Get module extra action forms by slug
   */
  async getModuleExtraActions(tenantId: string, slug: string, serviceName: string) {
    const module = await this.getModuleBySlug(tenantId, slug, serviceName);
    return module?.extraActionForms || [];
  }

  /**
   * Get module access policy by slug
   */
  async getModuleAccessPolicy(tenantId: string, slug: string, serviceName: string) {
    const module = await this.getModuleBySlug(tenantId, slug, serviceName);
    return module?.moduleAccessPolicy;
  }
}

/**
 * Get module schemas using React.cache for request-level deduplication
 * This is the single source of truth for module schemas
 */
export const getModuleSchemas = cache(
  async (tenantId: string, serviceName: string = 'core'): Promise<InitializeResponseDto> => {
    const apiUrl = await getApiDomain();
    const appSchemaService = new AppSchemaService(apiUrl);

    console.log(
      `🔧 Fetching module schemas for tenant: ${tenantId} from: ${apiUrl}/${serviceName}/initialize (using tenant context)`
    );

    return await appSchemaService.initialize(tenantId, serviceName);
  }
);

/**
 * Get all modules using React.cache
 */
export const getModules = cache(
  async (tenantId: string, serviceName: string = 'core'): Promise<ModuleSchema[]> => {
    const schemas = await getModuleSchemas(tenantId, serviceName);
    return Array.from(schemas.modules);
  }
);

/**
 * Get module by slug using React.cache
 */
export const getModuleBySlug = cache(
  async (tenantId: string, slug: string, serviceName: string = 'core'): Promise<ModuleSchema | undefined> => {
    const modules = await getModules(tenantId, serviceName);
    return findModuleBySlug(modules, slug);
  }
);

/**
 * Get modules by service name using React.cache
 */
export const getModulesByService = cache(
  async (tenantId: string, filterServiceName: string, serviceName: string = 'core'): Promise<ModuleSchema[]> => {
    const modules = await getModules(tenantId, serviceName);
    return getModulesByServiceUtil(modules, filterServiceName);
  }
);

/**
 * Get supported languages using React.cache
 */
export const getSupportedLanguages = cache(
  async (tenantId: string, serviceName: string = 'core'): Promise<SupportedLanguage[]> => {
    const schemas = await getModuleSchemas(tenantId, serviceName);
    return Array.from(schemas.supportedLanguages);
  }
);

/**
 * Get service information using React.cache
 */
export const getServiceInfo = cache(
  async (
    tenantId: string,
    serviceName: string = 'core'
  ): Promise<{ serviceName: string; timestamp: string }> => {
    const schemas = await getModuleSchemas(tenantId, serviceName);
    return {
      serviceName: schemas.serviceName,
      timestamp: schemas.timestamp,
    };
  }
);

/**
 * Check if module exists using React.cache
 */
export const hasModule = cache(
  async (tenantId: string, slug: string, serviceName: string = 'core'): Promise<boolean> => {
    const module = await getModuleBySlug(tenantId, slug, serviceName);
    return !!module;
  }
);

/**
 * Get module form fields using React.cache
 */
export const getModuleFormFields = cache(
  async (tenantId: string, slug: string, serviceName: string = 'core') => {
    const module = await getModuleBySlug(tenantId, slug, serviceName);
    return module?.formFields || [];
  }
);

/**
 * Get module table schema using React.cache
 */
export const getModuleTableSchema = cache(
  async (tenantId: string, slug: string, serviceName: string = 'core') => {
    const module = await getModuleBySlug(tenantId, slug, serviceName);
    return module?.dataTableSchema;
  }
);

/**
 * Get module extra action forms using React.cache
 */
export const getModuleExtraActions = cache(
  async (tenantId: string, slug: string, serviceName: string = 'core') => {
    const module = await getModuleBySlug(tenantId, slug, serviceName);
    return module?.extraActionForms || [];
  }
);

/**
 * Get module access policy using React.cache
 */
export const getModuleAccessPolicy = cache(
  async (tenantId: string, slug: string, serviceName: string = 'core') => {
    const module = await getModuleBySlug(tenantId, slug, serviceName);
    return module?.moduleAccessPolicy;
  }
);

/**
 * Validate module schemas exist and are valid
 */
export const validateModuleSchemas = cache(
  async (tenantId: string, serviceName: string = 'core'): Promise<boolean> => {
    try {
      const schemas = await getModuleSchemas(tenantId, serviceName);
      return !!(schemas && schemas.modules && schemas.modules.length > 0);
    } catch (error) {
      console.error(
        `Failed to validate module schemas for tenant ${tenantId}:`,
        error
      );
      return false;
    }
  }
);

/**
 * Clear module schemas cache (useful for testing or manual refresh)
 */
export async function clearModuleSchemasCache(
  tenantId?: string,
  serviceName: string = 'core'
): Promise<void> {
  const cache = getCacheInstance();

  if (tenantId) {
    // Clear specific tenant cache
    const cacheKey = CacheKeys.appInitialize(serviceName, tenantId);
    await cache.del(cacheKey);
    console.log(`Module schemas cache cleared for tenant: ${tenantId}, service: ${serviceName}`);
  } else {
    // Clear all module schemas cache across all tenants for the specified service
    await cache.deletePattern(`ciApp:*:App:Schema:${serviceName}`);
    console.log(`All module schemas cache cleared for service: ${serviceName}`);
  }
}

/**
 * Utility function to get localized text from module schema
 */
export function getLocalizedModuleText(
  text: { en: string; mm: string } | undefined,
  language: "en" | "mm" = "en"
): string {
  return getLocalizedText(text, language);
}

/**
 * Utility function to get core module names
 */
export function getCoreModuleNames(): CoreModuleName[] {
  return [
    "applications",
    "organizations",
    "departments",
    "users",
    "roles",
    "groups",
  ];
}

/**
 * Utility function to check if slug is a core module
 */
export function isCoreModule(slug: string): slug is CoreModuleName {
  return getCoreModuleNames().includes(slug as CoreModuleName);
}
