/**
 * Settings Service
 * Handles all API calls to the settings module
 * Following ModuleService pattern with httpClient.request()
 */

import { getCachedServerHttpClient } from '@repo/api/server-only';
import type { ApiResponse } from '@repo/types';
import type {
  Settings,
  PublicSettings,
  UpdateSettingsDto,
  SettingsResponse,
  PublicSettingsResponse,
} from '../types';

// Base endpoint for settings API
const SETTINGS_BASE = '/content/settings';

/**
 * Settings Service Class
 * Follows ModuleService pattern with proper request config
 */
export class SettingsService {
  private httpClient;
  private baseURL: string;
  private tenantId?: string;
  private userSessionId?: string;
  private userId?: string;

  constructor(
    baseURL: string,
    options?: {
      tenantId?: string;
      userSessionId?: string;
      userId?: string;
    }
  ) {
    this.baseURL = baseURL;
    this.httpClient = getCachedServerHttpClient(baseURL);
    this.tenantId = options?.tenantId;
    this.userSessionId = options?.userSessionId;
    this.userId = options?.userId;
  }

  /**
   * Get current settings
   */
  async get(): Promise<ApiResponse<Settings>> {
    const response = await this.httpClient.request<Settings>(
      SETTINGS_BASE,
      {
        method: 'GET',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch settings');
    }

    return response;
  }

  /**
   * Get public settings (no auth required)
   */
  async getPublic(): Promise<ApiResponse<PublicSettings>> {
    const response = await this.httpClient.request<PublicSettings>(
      `${SETTINGS_BASE}/public`,
      {
        method: 'GET',
        tenantId: this.tenantId,
        withAuth: false,
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch public settings');
    }

    return response;
  }

  /**
   * Initialize settings (if not exists)
   */
  async initialize(): Promise<ApiResponse<Settings>> {
    const response = await this.httpClient.request<Settings>(
      SETTINGS_BASE,
      {
        method: 'POST',
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to initialize settings');
    }

    return response;
  }

  /**
   * Update settings
   */
  async update(data: UpdateSettingsDto): Promise<ApiResponse<Settings>> {
    const response = await this.httpClient.request<Settings>(
      SETTINGS_BASE,
      {
        method: 'PATCH',
        body: data,
        tenantId: this.tenantId,
        userSessionId: this.userSessionId,
        userId: this.userId,
        withAuth: true,
        tokenStrategy: 'auto',
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to update settings');
    }

    return response;
  }

  /**
   * Update theme settings
   */
  async updateTheme(themeName: string): Promise<ApiResponse<Settings>> {
    return this.update({ themeName });
  }

  /**
   * Update layout settings
   */
  async updateLayout(layout: UpdateSettingsDto['layout']): Promise<ApiResponse<Settings>> {
    return this.update({ layout });
  }

  /**
   * Update header settings
   */
  async updateHeader(header: UpdateSettingsDto['header']): Promise<ApiResponse<Settings>> {
    return this.update({ header });
  }

  /**
   * Update footer settings
   */
  async updateFooter(footer: UpdateSettingsDto['footer']): Promise<ApiResponse<Settings>> {
    return this.update({ footer });
  }

  /**
   * Update SEO defaults
   */
  async updateSeo(data: Pick<UpdateSettingsDto, 'metaTitle' | 'metaDescription' | 'metaKeywords'>): Promise<ApiResponse<Settings>> {
    return this.update(data);
  }

  /**
   * Update language settings
   */
  async updateLanguages(defaultLanguage: string, availableLanguages: string[]): Promise<ApiResponse<Settings>> {
    return this.update({ defaultLanguage, availableLanguages });
  }

  /**
   * Set home page
   */
  async setHomePage(homePageId: string): Promise<ApiResponse<Settings>> {
    return this.update({ homePageId });
  }

  /**
   * Enable/disable header menu
   */
  async toggleHeaderMenu(enabled: boolean, menuId?: string): Promise<ApiResponse<Settings>> {
    return this.update({
      enableHeaderMenu: enabled,
      headerMenuId: menuId,
    });
  }

  /**
   * Enable/disable footer menu
   */
  async toggleFooterMenu(enabled: boolean, menuId?: string): Promise<ApiResponse<Settings>> {
    return this.update({
      enableFooterMenu: enabled,
      footerMenuId: menuId,
    });
  }
}
