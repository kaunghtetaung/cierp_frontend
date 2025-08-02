// Server-side page wrapper using PageService
import { 
  PageService, 
  getPageBySlug,
  getPageMeta,
  isPageAccessible,
  getPageSections,
  validatePage,
  clearPageCache,
  getLocalizedText,
  getPageUrl,
  isPagePublished,
  type PageData,
  type PageSEO,
  type LayoutSettings
} from './page-service';
import type { MultiLanguageText, SectionData } from '@repo/types';
import { getApiDomain } from '@repo/utils/server';

export interface PageWrapperConfig {
  readonly gatewayPort: string;
  readonly authPort: string;
  readonly cacheEnabled: boolean;
  readonly cacheTtl: number;
  readonly enableSecrets: boolean;
}

const DEFAULT_CONFIG: PageWrapperConfig = {
  gatewayPort: process.env.PORT_GATEWAY || '3331',
  authPort: process.env.PORT_AUTH || '3332',
  cacheEnabled: true,
  cacheTtl: 60 * 60 * 24, // 24 hours
  enableSecrets: true
};

/**
 * Server-side page wrapper class that manages pages using PageService
 * This is a facade pattern over PageService for backward compatibility
 */
export class PageWrapper {
  private config: PageWrapperConfig;
  private pageService: PageService | null = null;

  constructor(config: Partial<PageWrapperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async ensureService(): Promise<PageService> {
    if (!this.pageService) {
      const baseURL = await getApiDomain();
      this.pageService = new PageService(baseURL);
    }
    return this.pageService;
  }

  /**
   * Get page by slug using PageService
   */
  async getPageBySlug(slug: string): Promise<PageData | null> {
    if (!slug || typeof slug !== 'string') {
      console.error('Invalid slug format:', slug);
      return null;
    }

    try {
      const service = await this.ensureService();
      return await service.getPageBySlug(slug);
    } catch (error) {
      console.error('Error getting page by slug:', error);
      return null;
    }
  }

  /**
   * Get page meta information using PageService
   */
  async getPageMeta(slug: string): Promise<{
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  } | null> {
    try {
      const service = await this.ensureService();
      return await service.getPageMeta(slug);
    } catch (error) {
      console.error('Error getting page meta:', error);
      return null;
    }
  }

  /**
   * Check if page is accessible using PageService
   */
  async isPageAccessible(slug: string): Promise<boolean> {
    try {
      const service = await this.ensureService();
      return await service.isPageAccessible(slug);
    } catch (error) {
      console.error('Error checking page accessibility:', error);
      return false;
    }
  }

  /**
   * Get page sections using PageService
   */
  async getPageSections(slug: string): Promise<SectionData[]> {
    try {
      const service = await this.ensureService();
      return await service.getPageSections(slug);
    } catch (error) {
      console.error('Error getting page sections:', error);
      return [];
    }
  }

  /**
   * Clear page cache using PageService
   */
  async clearPageCache(tenantId?: string, slug?: string): Promise<void> {
    return await clearPageCache(tenantId, slug);
  }
}

/**
 * Default page wrapper instance
 */
export const pageWrapper = new PageWrapper();

/**
 * Convenience functions using the cached service functions directly
 * These are the preferred methods for server-side usage as they use React.cache
 */
export const getPage = getPageBySlug;
export const getPageList = getPageBySlug; // Alias for backward compatibility

// Export all page functions
export { 
  getPageBySlug,
  getPageMeta,
  isPageAccessible,
  getPageSections,
  validatePage,
  clearPageCache,
  getLocalizedText,
  getPageUrl,
  isPagePublished
};

/**
 * Server-side helper to get page for request context
 */
export async function getPageForRequest(slug: string): Promise<PageData | null> {
  return await getPageBySlug(slug);
}

/**
 * Server-side helper to get page with accessibility check
 */
export async function getAccessiblePage(slug: string): Promise<PageData | null> {
  try {
    const accessible = await isPageAccessible(slug);
    if (!accessible) {
      return null;
    }
    return await getPageBySlug(slug);
  } catch (error) {
    console.error('Error getting accessible page:', error);
    return null;
  }
}

/**
 * Re-export types from page service and centralized types
 */
export type { 
  PageData,
  PageSEO,
  LayoutSettings
} from './page-service';

export type { 
  MultiLanguageText,
  SectionData
} from '@repo/types';

/**
 * Re-export PageService for direct usage if needed
 */
export { PageService };