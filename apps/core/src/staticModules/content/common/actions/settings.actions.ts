/**
 * Settings Server Actions
 * Next.js 15 Server Actions for settings management
 */

'use server';

import { headers } from 'next/headers';
import { getCurrentUser, getCurrentSession } from '@repo/auth/server-api';
import { getApiDomain } from '@repo/utils/server';
import { SettingsService } from '../services/settings.service';
import type { ApiResponse } from '@repo/types';
import type {
  Settings,
  PublicSettings,
  UpdateSettingsDto,
} from '../types';

/**
 * Get settings service instance with proper context
 */
async function getSettingsService(): Promise<SettingsService> {
  const headerStore = await headers();
  const [user, session] = await Promise.all([
    getCurrentUser(headerStore),
    getCurrentSession(headerStore),
  ]);

  if (!user || !session) {
    throw new Error('Authentication required');
  }

  const tenantId = headerStore.get('x-tenant-id') || user.tenantId || session.tenantId;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }

  const apiUrl = await getApiDomain();

  return new SettingsService(apiUrl, {
    tenantId,
    userSessionId: session.id,
    userId: user.id,
  });
}

/**
 * Get settings service for public access (no auth required)
 */
async function getPublicSettingsService(): Promise<SettingsService> {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');

  if (!tenantId) {
    throw new Error('Tenant context required');
  }

  const apiUrl = await getApiDomain();

  return new SettingsService(apiUrl, {
    tenantId,
  });
}

/**
 * Get current settings
 */
export async function getSettings(): Promise<ApiResponse<Settings>> {
  try {
    const service = await getSettingsService();
    const response = await service.get();
    return response;
  } catch (error) {
    console.error('Get settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch settings',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Get public settings (no auth required)
 */
export async function getPublicSettings(): Promise<ApiResponse<PublicSettings>> {
  try {
    const service = await getPublicSettingsService();
    const response = await service.getPublic();
    return response;
  } catch (error) {
    console.error('Get public settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch public settings',
      message: 'Fetch failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Initialize settings
 */
export async function initializeSettings(): Promise<ApiResponse<Settings>> {
  try {
    const service = await getSettingsService();
    const response = await service.initialize();
    return response;
  } catch (error) {
    console.error('Initialize settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize settings',
      message: 'Initialize failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update settings
 */
export async function updateSettings(
  data: UpdateSettingsDto
): Promise<ApiResponse<Settings>> {
  try {
    const service = await getSettingsService();
    const response = await service.update(data);
    return response;
  } catch (error) {
    console.error('Update settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update theme
 */
export async function updateTheme(
  themeName: string
): Promise<ApiResponse<Settings>> {
  try {
    const service = await getSettingsService();
    const response = await service.updateTheme(themeName);
    return response;
  } catch (error) {
    console.error('Update theme error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update theme',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update layout settings
 */
export async function updateLayout(
  layout: UpdateSettingsDto['layout']
): Promise<ApiResponse<Settings>> {
  try {
    const service = await getSettingsService();
    const response = await service.updateLayout(layout);
    return response;
  } catch (error) {
    console.error('Update layout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update layout',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update header settings
 */
export async function updateHeaderSettings(
  header: UpdateSettingsDto['header']
): Promise<ApiResponse<Settings>> {
  try {
    const service = await getSettingsService();
    const response = await service.updateHeader(header);
    return response;
  } catch (error) {
    console.error('Update header settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update header settings',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update footer settings
 */
export async function updateFooterSettings(
  footer: UpdateSettingsDto['footer']
): Promise<ApiResponse<Settings>> {
  try {
    const service = await getSettingsService();
    const response = await service.updateFooter(footer);
    return response;
  } catch (error) {
    console.error('Update footer settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update footer settings',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update SEO defaults
 */
export async function updateSeoSettings(
  data: Pick<UpdateSettingsDto, 'metaTitle' | 'metaDescription' | 'metaKeywords'>
): Promise<ApiResponse<Settings>> {
  try {
    const service = await getSettingsService();
    const response = await service.updateSeo(data);
    return response;
  } catch (error) {
    console.error('Update SEO settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update SEO settings',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Update language settings
 */
export async function updateLanguageSettings(
  defaultLanguage: string,
  availableLanguages: string[]
): Promise<ApiResponse<Settings>> {
  try {
    const service = await getSettingsService();
    const response = await service.updateLanguages(defaultLanguage, availableLanguages);
    return response;
  } catch (error) {
    console.error('Update language settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update language settings',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Set home page
 */
export async function setHomePage(
  homePageId: string
): Promise<ApiResponse<Settings>> {
  try {
    const service = await getSettingsService();
    const response = await service.setHomePage(homePageId);
    return response;
  } catch (error) {
    console.error('Set home page error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set home page',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Toggle header menu
 */
export async function toggleHeaderMenu(
  enabled: boolean,
  menuId?: string
): Promise<ApiResponse<Settings>> {
  try {
    const service = await getSettingsService();
    const response = await service.toggleHeaderMenu(enabled, menuId);
    return response;
  } catch (error) {
    console.error('Toggle header menu error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle header menu',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}

/**
 * Toggle footer menu
 */
export async function toggleFooterMenu(
  enabled: boolean,
  menuId?: string
): Promise<ApiResponse<Settings>> {
  try {
    const service = await getSettingsService();
    const response = await service.toggleFooterMenu(enabled, menuId);
    return response;
  } catch (error) {
    console.error('Toggle footer menu error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle footer menu',
      message: 'Update failed',
      data: null as any,
      timestamp: new Date(),
    };
  }
}
