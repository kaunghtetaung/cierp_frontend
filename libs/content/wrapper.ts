// Server-side content settings wrapper using ContentService
import { 
  ContentService, 
  getContentSettings,
  getHeaderSettings,
  getFooterSettings,
  getHeaderMenu,
  getFooterMenu,
  getLayoutSettings,
  getMetaInfo,
  getThemeName,
  getLanguageSettings,
  validateContentSettings,
  clearContentSettingsCache,
  getLocalizedText,
  shouldShowMenuItem
} from './content-service';
import type {
  ContentSettingsData,
  HeaderSettings,
  FooterSettings,
  MenuItemSettings,
  LayoutSettings,
  MultiLanguageText
} from '@repo/types/content';
import { getApiDomain } from '@repo/utils/server';
import { isValidTenantId } from '@repo/utils/common/validation';

export interface ContentWrapperConfig {
  readonly gatewayPort: string;
  readonly authPort: string;
  readonly cacheEnabled: boolean;
  readonly cacheTtl: number;
  readonly enableSecrets: boolean;
}

const DEFAULT_CONFIG: ContentWrapperConfig = {
  gatewayPort: process.env.PORT_GATEWAY || '3331',
  authPort: process.env.PORT_AUTH || '3332',
  cacheEnabled: true,
  cacheTtl: 60 * 60 * 24, // 24 hours
  enableSecrets: true
};

/**
 * Server-side content settings wrapper class that manages content settings using ContentService
 * This is a facade pattern over ContentService for backward compatibility
 */
export class ContentWrapper {
  private config: ContentWrapperConfig;
  private contentService: ContentService | null = null;

  constructor(config: Partial<ContentWrapperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async ensureService(): Promise<ContentService> {
    if (!this.contentService) {
      const baseURL = await getApiDomain();
      this.contentService = new ContentService(baseURL);
    }
    return this.contentService;
  }

  /**
   * Get effective content settings using ContentService
   */
  async getEffective(tenantId: string): Promise<ContentSettingsData | null> {
    console.log("🎯 Tenant ID:", tenantId);
    
    if (!isValidTenantId(tenantId)) {
      console.error('🎯 ERROR: Invalid tenant ID format:', tenantId);
      console.log("🎯 === CONTENT WRAPPER GET EFFECTIVE END (INVALID) ===\n");
      return null;
    }

    try {
      console.log("🎯 Getting service instance...");
      const service = await this.ensureService();
      console.log("🎯 Calling service.getEffective...");
      const result = await service.getEffective(tenantId);
      console.log("🎯 Service returned successfully");
      console.log("🎯 === CONTENT WRAPPER GET EFFECTIVE END (SUCCESS) ===\n");
      return result;
    } catch (error) {
      console.error('🎯 ERROR getting content settings:', error);
      console.log("🎯 === CONTENT WRAPPER GET EFFECTIVE END (ERROR) ===\n");
      return null;
    }
  }

  /**
   * Get header settings using ContentService
   */
  async getHeaderSettings(tenantId: string): Promise<HeaderSettings | null> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return null;
    }

    try {
      const service = await this.ensureService();
      return await service.getHeaderSettings(tenantId);
    } catch (error) {
      console.error('Error getting header settings:', error);
      return null;
    }
  }

  /**
   * Get footer settings using ContentService
   */
  async getFooterSettings(tenantId: string): Promise<FooterSettings | null> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return null;
    }

    try {
      const service = await this.ensureService();
      return await service.getFooterSettings(tenantId);
    } catch (error) {
      console.error('Error getting footer settings:', error);
      return null;
    }
  }

  /**
   * Get header menu using ContentService
   */
  async getHeaderMenu(tenantId: string): Promise<MenuItemSettings[]> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return [];
    }

    try {
      const service = await this.ensureService();
      return await service.getHeaderMenu(tenantId);
    } catch (error) {
      console.error('Error getting header menu:', error);
      return [];
    }
  }

  /**
   * Get footer menu using ContentService
   */
  async getFooterMenu(tenantId: string): Promise<MenuItemSettings[]> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return [];
    }

    try {
      const service = await this.ensureService();
      return await service.getFooterMenu(tenantId);
    } catch (error) {
      console.error('Error getting footer menu:', error);
      return [];
    }
  }

  /**
   * Get layout settings using ContentService
   */
  async getLayoutSettings(tenantId: string): Promise<LayoutSettings | null> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return null;
    }

    try {
      const service = await this.ensureService();
      return await service.getLayoutSettings(tenantId);
    } catch (error) {
      console.error('Error getting layout settings:', error);
      return null;
    }
  }

  /**
   * Get theme name using ContentService
   */
  async getThemeName(tenantId: string): Promise<string | null> {
    if (!isValidTenantId(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId);
      return null;
    }

    try {
      const service = await this.ensureService();
      return await service.getThemeName(tenantId);
    } catch (error) {
      console.error('Error getting theme name:', error);
      return null;
    }
  }

  /**
   * Clear content settings cache using ContentService
   */
  async clearContentSettingsCache(tenantId?: string): Promise<void> {
    return await clearContentSettingsCache(tenantId);
  }
}

/**
 * Default content wrapper instance
 */
export const contentWrapper = new ContentWrapper();

/**
 * Convenience functions using the cached service functions directly
 * These are the preferred methods for server-side usage as they use React.cache
 */
export const getEffective = getContentSettings;
export const getContentList = getContentSettings; // Alias for backward compatibility
export const getContent = getContentSettings; // Alias for backward compatibility

// Export all content settings functions
export { 
  getContentSettings,
  getHeaderSettings,
  getFooterSettings,
  getHeaderMenu,
  getFooterMenu,
  getLayoutSettings,
  getMetaInfo,
  getThemeName,
  getLanguageSettings,
  validateContentSettings,
  clearContentSettingsCache,
  getLocalizedText,
  shouldShowMenuItem
};

/**
 * Server-side helper to get content settings for request context
 */
export async function getContentForRequest(tenantId: string): Promise<ContentSettingsData | null> {
  return await getContentSettings(tenantId);
}

/**
 * Re-export types from content service
 */
export type { 
  ContentSettingsData,
  HeaderSettings,
  FooterSettings,
  MenuItemSettings,
  LayoutSettings,
  MultiLanguageText
};

/**
 * Re-export ContentService for direct usage if needed
 */
export { ContentService };