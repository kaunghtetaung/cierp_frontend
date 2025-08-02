// Content settings service - Read-only API for CMS configuration (header, footer, navigation, etc.)
// NOT for content items like pages/posts/news - those are handled by separate content management modules
import { cache } from "react";
import { getApiDomain } from "@repo/utils/server";
import { createHttpClient } from "@repo/api/client";
import { getCacheInstance, CacheKeys, CacheTTL } from "@repo/cache";
import type { ApiResponse } from "@repo/types";
import type {
  ContentSettingsData,
  HeaderSettings,
  FooterSettings,
  MenuItemSettings,
  LayoutSettings,
  MultiLanguageText,
  FooterColumn,
  SocialLink,
  HomePageInfo
} from "@repo/types/content";

export class ContentService {
  private httpClient;
  private cache = getCacheInstance();

  constructor(baseURL: string) {
    this.httpClient = createHttpClient({
      baseURL,
      enableAuth: true,
      enableCSRF: false, // Content settings API doesn't need CSRF
      timeout: 10000 // 10 second timeout for server requests
    });
  }

  /**
   * Get effective content settings for a tenant (read-only)
   * This is the main method for fetching content settings
   */
  async getEffective(tenantId: string): Promise<ContentSettingsData> {
    const cacheKey = CacheKeys.contentSettings(tenantId);

    // Try to get from cache first
    const cachedSettings = await this.cache.get<ContentSettingsData>(cacheKey);
    if (cachedSettings && this.isValidContentSettings(cachedSettings)) {
      return cachedSettings;
    }

    // Fetch from API using HTTP client with tenant context
    const response: ApiResponse<ContentSettingsData> = await this.httpClient.request(
      `/content/settings/tenant/effective`,
      {
        method: 'GET',
        tenantId,
        withAuth: true
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch content settings');
    }

    const settingsData = response.data;

    // Validate and cache the result
    if (this.isValidContentSettings(settingsData)) {
      await this.cache.set(cacheKey, settingsData, CacheTTL.CONTENT || 60 * 60 * 24);
    }

    return settingsData;
  }

  /**
   * Validate that content settings data is complete and valid
   */
  private isValidContentSettings(data: any): data is ContentSettingsData {
    return data && 
           typeof data === 'object' &&
           data.id &&
           data.organizationId &&
           data.themeName &&
           data.layout &&
           data.header &&
           data.footer;
  }

  /**
   * Get header settings only
   */
  async getHeaderSettings(tenantId: string): Promise<HeaderSettings> {
    const settings = await this.getEffective(tenantId);
    return settings.header;
  }

  /**
   * Get footer settings only
   */
  async getFooterSettings(tenantId: string): Promise<FooterSettings> {
    const settings = await this.getEffective(tenantId);
    return settings.footer;
  }

  /**
   * Get navigation menu items
   */
  async getHeaderMenu(tenantId: string): Promise<MenuItemSettings[]> {
    const settings = await this.getEffective(tenantId);
    return settings.enableHeaderMenu ? settings.headerMenu : [];
  }

  /**
   * Get footer menu items
   */
  async getFooterMenu(tenantId: string): Promise<MenuItemSettings[]> {
    const settings = await this.getEffective(tenantId);
    return settings.enableFooterMenu ? settings.footerMenu : [];
  }

  /**
   * Get layout settings
   */
  async getLayoutSettings(tenantId: string): Promise<LayoutSettings> {
    const settings = await this.getEffective(tenantId);
    return settings.layout;
  }

  /**
   * Get meta information for SEO
   */
  async getMetaInfo(tenantId: string): Promise<{
    title?: string;
    description?: string;
    keywords?: string[];
  }> {
    const settings = await this.getEffective(tenantId);
    return {
      title: settings.metaTitle,
      description: settings.metaDescription,
      keywords: settings.metaKeywords
    };
  }

  /**
   * Get theme name
   */
  async getThemeName(tenantId: string): Promise<string> {
    const settings = await this.getEffective(tenantId);
    return settings.themeName;
  }

  /**
   * Get supported languages
   */
  async getLanguageSettings(tenantId: string): Promise<{
    defaultLanguage: string;
    availableLanguages: string[];
  }> {
    const settings = await this.getEffective(tenantId);
    return {
      defaultLanguage: settings.defaultLanguage,
      availableLanguages: settings.availableLanguages
    };
  }
}

/**
 * Get content settings using React.cache for request-level deduplication
 * This is the single source of truth for content settings
 */
export const getContentSettings = cache(
  async (tenantId: string): Promise<ContentSettingsData> => {
    const apiUrl = await getApiDomain();
    const contentService = new ContentService(apiUrl);

    console.log(
      `🎨 Fetching content settings for tenant: ${tenantId} from: ${apiUrl} (using tenant context)`
    );

    return await contentService.getEffective(tenantId);
  }
);

/**
 * Get header settings using React.cache
 */
export const getHeaderSettings = cache(
  async (tenantId: string): Promise<HeaderSettings> => {
    const settings = await getContentSettings(tenantId);
    return settings.header;
  }
);

/**
 * Get footer settings using React.cache
 */
export const getFooterSettings = cache(
  async (tenantId: string): Promise<FooterSettings> => {
    const settings = await getContentSettings(tenantId);
    return settings.footer;
  }
);

/**
 * Get header menu using React.cache
 */
export const getHeaderMenu = cache(
  async (tenantId: string): Promise<MenuItemSettings[]> => {
    const settings = await getContentSettings(tenantId);
    return settings.enableHeaderMenu ? settings.headerMenu : [];
  }
);

/**
 * Get footer menu using React.cache
 */
export const getFooterMenu = cache(
  async (tenantId: string): Promise<MenuItemSettings[]> => {
    const settings = await getContentSettings(tenantId);
    return settings.enableFooterMenu ? settings.footerMenu : [];
  }
);

/**
 * Get layout settings using React.cache
 */
export const getLayoutSettings = cache(
  async (tenantId: string): Promise<LayoutSettings> => {
    const settings = await getContentSettings(tenantId);
    return settings.layout;
  }
);

/**
 * Get meta information using React.cache
 */
export const getMetaInfo = cache(
  async (tenantId: string): Promise<{
    title?: string;
    description?: string;
    keywords?: string[];
  }> => {
    const settings = await getContentSettings(tenantId);
    return {
      title: settings.metaTitle,
      description: settings.metaDescription,
      keywords: settings.metaKeywords
    };
  }
);

/**
 * Get theme name using React.cache
 */
export const getThemeName = cache(
  async (tenantId: string): Promise<string> => {
    const settings = await getContentSettings(tenantId);
    return settings.themeName;
  }
);

/**
 * Get language settings using React.cache
 */
export const getLanguageSettings = cache(
  async (tenantId: string): Promise<{
    defaultLanguage: string;
    availableLanguages: string[];
  }> => {
    const settings = await getContentSettings(tenantId);
    return {
      defaultLanguage: settings.defaultLanguage,
      availableLanguages: settings.availableLanguages
    };
  }
);

/**
 * Validate content settings exist and are valid
 */
export const validateContentSettings = cache(
  async (tenantId: string): Promise<boolean> => {
    try {
      const settings = await getContentSettings(tenantId);
      return !!(settings && settings.id && settings.organizationId);
    } catch (error) {
      console.error(`Failed to validate content settings for tenant ${tenantId}:`, error);
      return false;
    }
  }
);

/**
 * Clear content settings cache (useful for testing or manual refresh)
 */
export async function clearContentSettingsCache(tenantId?: string): Promise<void> {
  const cache = getCacheInstance();

  if (tenantId) {
    // Clear specific tenant cache
    const cacheKey = CacheKeys.contentSettings(tenantId);
    await cache.del(cacheKey);
    console.log(`Content settings cache cleared for tenant: ${tenantId}`);
  } else {
    // Clear all content settings cache across all tenants
    await cache.deletePattern('ciApp:*:Content:Settings:*');
    console.log('All content settings cache cleared');
  }
}

/**
 * Utility function to get text in the correct language
 */
export function getLocalizedText(
  text: MultiLanguageText | string | undefined,
  language: string = 'en'
): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  
  // Return the requested language or fallback to English
  return text[language as keyof MultiLanguageText] || text.en || '';
}

/**
 * Utility function to check if a menu item should be shown based on auth requirements
 */
export function shouldShowMenuItem(
  menuItem: MenuItemSettings,
  isAuthenticated: boolean = false,
  userRoles: string[] = []
): boolean {
  // If no auth required, always show
  if (!menuItem.requiresAuth) return true;
  
  // If auth required but user not authenticated, don't show
  if (menuItem.requiresAuth && !isAuthenticated) return false;
  
  // If specific roles required, check if user has any of them
  if (menuItem.allowedRoles && menuItem.allowedRoles.length > 0) {
    return menuItem.allowedRoles.some(role => userRoles.includes(role));
  }
  
  // Auth required and user is authenticated (no specific roles required)
  return true;
}