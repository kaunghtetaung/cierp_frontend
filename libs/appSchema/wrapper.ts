// Server-side app schema wrapper using AppSchemaService
import { 
  AppSchemaService, 
  getModuleSchemas,
  getModules,
  getModuleBySlug,
  getModulesByService,
  getSupportedLanguages,
  getServiceInfo,
  hasModule,
  getModuleFormFields,
  getModuleTableSchema,
  getModuleExtraActions,
  getModuleAccessPolicy,
  validateModuleSchemas,
  clearModuleSchemasCache,
  getLocalizedModuleText,
  getCoreModuleNames,
  isCoreModule
} from './appSchema.service';
import type {
  InitializeResponseDto,
  ModuleSchema,
  SupportedLanguage,
  CoreModuleName,
  FormField,
  DataTableSchema,
  ExtraActionForm,
  ModuleAccessPolicy
} from '@repo/types';
import { getApiDomain } from '@repo/utils/server';
import { isValidTenantId } from '@repo/utils/common/validation';

export interface AppSchemaWrapperConfig {
  readonly gatewayPort: string;
  readonly authPort: string;
  readonly cacheEnabled: boolean;
  readonly cacheTtl: number;
  readonly enableSecrets: boolean;
}

const DEFAULT_CONFIG: AppSchemaWrapperConfig = {
  gatewayPort: process.env.PORT_GATEWAY || '3331',
  authPort: process.env.PORT_AUTH || '3332',
  cacheEnabled: true,
  cacheTtl: 60 * 60 * 24, // 24 hours
  enableSecrets: true
};

/**
 * Server-side app schema wrapper class that manages module schemas using AppSchemaService
 * This is a facade pattern over AppSchemaService for backward compatibility
 */
export class AppSchemaWrapper {
  private config: AppSchemaWrapperConfig;
  private appSchemaService: AppSchemaService | null = null;

  constructor(config: Partial<AppSchemaWrapperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async ensureService(): Promise<AppSchemaService> {
    if (!this.appSchemaService) {
      const baseURL = await getApiDomain();
      this.appSchemaService = new AppSchemaService(baseURL);
    }
    return this.appSchemaService;
  }

  /**
   * Initialize and get module schemas using AppSchemaService
   */
  async initialize(tenantId: string): Promise<InitializeResponseDto | null> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return null;
    }

    try {
      const service = await this.ensureService();
      return await service.initialize(tenantId);
    } catch (error) {
      console.error('Error initializing module schemas:', error);
      return null;
    }
  }

  /**
   * Get all modules using AppSchemaService
   */
  async getModules(tenantId: string): Promise<ModuleSchema[]> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return [];
    }

    try {
      const service = await this.ensureService();
      return await service.getModules(tenantId);
    } catch (error) {
      console.error('Error getting modules:', error);
      return [];
    }
  }

  /**
   * Get module by slug using AppSchemaService
   */
  async getModuleBySlug(tenantId: string, slug: string): Promise<ModuleSchema | null> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return null;
    }

    try {
      const service = await this.ensureService();
      const module = await service.getModuleBySlug(tenantId, slug);
      return module || null;
    } catch (error) {
      console.error('Error getting module by slug:', error);
      return null;
    }
  }

  /**
   * Get modules by service name using AppSchemaService
   */
  async getModulesByService(tenantId: string, serviceName: string): Promise<ModuleSchema[]> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return [];
    }

    try {
      const service = await this.ensureService();
      return await service.getModulesByService(tenantId, serviceName);
    } catch (error) {
      console.error('Error getting modules by service:', error);
      return [];
    }
  }

  /**
   * Get supported languages using AppSchemaService
   */
  async getSupportedLanguages(tenantId: string): Promise<SupportedLanguage[]> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return [];
    }

    try {
      const service = await this.ensureService();
      return await service.getSupportedLanguages(tenantId);
    } catch (error) {
      console.error('Error getting supported languages:', error);
      return [];
    }
  }

  /**
   * Check if module exists using AppSchemaService
   */
  async hasModule(tenantId: string, slug: string): Promise<boolean> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return false;
    }

    try {
      const service = await this.ensureService();
      return await service.hasModule(tenantId, slug);
    } catch (error) {
      console.error('Error checking module existence:', error);
      return false;
    }
  }

  /**
   * Get module form fields using AppSchemaService
   */
  async getModuleFormFields(tenantId: string, slug: string): Promise<FormField[]> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return [];
    }

    try {
      const service = await this.ensureService();
      return await service.getModuleFormFields(tenantId, slug);
    } catch (error) {
      console.error('Error getting module form fields:', error);
      return [];
    }
  }

  /**
   * Get module table schema using AppSchemaService
   */
  async getModuleTableSchema(tenantId: string, slug: string): Promise<DataTableSchema | null> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return null;
    }

    try {
      const service = await this.ensureService();
      const schema = await service.getModuleTableSchema(tenantId, slug);
      return schema || null;
    } catch (error) {
      console.error('Error getting module table schema:', error);
      return null;
    }
  }

  /**
   * Get module extra actions using AppSchemaService
   */
  async getModuleExtraActions(tenantId: string, slug: string): Promise<ExtraActionForm[]> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return [];
    }

    try {
      const service = await this.ensureService();
      return await service.getModuleExtraActions(tenantId, slug);
    } catch (error) {
      console.error('Error getting module extra actions:', error);
      return [];
    }
  }

  /**
   * Get module access policy using AppSchemaService
   */
  async getModuleAccessPolicy(tenantId: string, slug: string): Promise<ModuleAccessPolicy | null> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return null;
    }

    try {
      const service = await this.ensureService();
      const policy = await service.getModuleAccessPolicy(tenantId, slug);
      return policy || null;
    } catch (error) {
      console.error('Error getting module access policy:', error);
      return null;
    }
  }

  /**
   * Clear module schemas cache using AppSchemaService
   */
  async clearModuleSchemasCache(tenantId?: string): Promise<void> {
    return await clearModuleSchemasCache(tenantId);
  }
}

/**
 * Default app schema wrapper instance
 */
export const appSchemaWrapper = new AppSchemaWrapper();

/**
 * Convenience functions using the cached service functions directly
 * These are the preferred methods for server-side usage as they use React.cache
 */
export const initialize = getModuleSchemas;
export const getSchemas = getModuleSchemas; // Alias for backward compatibility
export const getAppSchema = getModuleSchemas; // Alias for backward compatibility

// Export all module schema functions
export { 
  getModuleSchemas,
  getModules,
  getModuleBySlug,
  getModulesByService,
  getSupportedLanguages,
  getServiceInfo,
  hasModule,
  getModuleFormFields,
  getModuleTableSchema,
  getModuleExtraActions,
  getModuleAccessPolicy,
  validateModuleSchemas,
  clearModuleSchemasCache,
  getLocalizedModuleText,
  getCoreModuleNames,
  isCoreModule
};

/**
 * Server-side helper to get module schemas for request context
 */
export async function getSchemasForRequest(tenantId: string): Promise<InitializeResponseDto | null> {
  if (!isValidTenantId(tenantId)) {
    console.error('Invalid tenant ID format:', tenantId);
    return null;
  }

  try {
    return await getModuleSchemas(tenantId);
  } catch (error) {
    console.error('Error getting schemas for request:', error);
    return null;
  }
}

/**
 * Server-side helper to get specific module for request context
 */
export async function getModuleForRequest(tenantId: string, slug: string): Promise<ModuleSchema | null> {
  if (!isValidTenantId(tenantId)) {
    console.error('Invalid tenant ID format:', tenantId);
    return null;
  }

  try {
    return await getModuleBySlug(tenantId, slug);
  } catch (error) {
    console.error('Error getting module for request:', error);
    return null;
  }
}

/**
 * Re-export types from app schema service
 */
export type { 
  InitializeResponseDto,
  ModuleSchema,
  SupportedLanguage,
  CoreModuleName,
  FormField,
  DataTableSchema,
  ExtraActionForm,
  ModuleAccessPolicy
};

/**
 * Re-export AppSchemaService for direct usage if needed
 */
export { AppSchemaService };