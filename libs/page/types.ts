// Page type definitions with section integration
import type { SectionData, SectionType, MultiLanguageText } from '@repo/section';
import type { User } from '@repo/types';

/**
 * Page status enum
 */
export type PageStatus = 'Draft' | 'Published' | 'Archived' | 'Scheduled';

/**
 * Page visibility enum
 */
export type PageVisibility = 'Public' | 'Private' | 'Protected';

/**
 * Page layout types
 */
export type PageLayout = 'default' | 'full-width' | 'sidebar-left' | 'sidebar-right' | 'landing';

/**
 * SEO metadata for pages
 */
export interface PageSEO {
  readonly title?: string;
  readonly description?: string;
  readonly keywords?: string[];
  readonly ogTitle?: string;
  readonly ogDescription?: string;
  readonly ogImage?: string;
  readonly ogType?: string;
  readonly twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  readonly twitterSite?: string;
  readonly twitterCreator?: string;
  readonly canonicalUrl?: string;
  readonly noIndex?: boolean;
  readonly noFollow?: boolean;
}

/**
 * Page analytics and tracking
 */
export interface PageAnalytics {
  readonly gtmId?: string;
  readonly gaId?: string;
  readonly fbPixelId?: string;
  readonly customScripts?: string[];
  readonly trackingEvents?: Record<string, unknown>;
}

/**
 * Page access control
 */
export interface PageAccess {
  readonly requireAuth: boolean;
  readonly allowedRoles?: string[];
  readonly allowedUsers?: string[];
  readonly restrictedCountries?: string[];
  readonly allowedCountries?: string[];
  readonly passwordProtected?: boolean;
  readonly password?: string;
}

/**
 * Page navigation and structure
 */
export interface PageNavigation {
  readonly showInMenu: boolean;
  readonly menuLabel?: MultiLanguageText;
  readonly menuOrder?: number;
  readonly parentPageId?: string;
  readonly breadcrumbTitle?: MultiLanguageText;
  readonly hideFromSitemap?: boolean;
}

/**
 * Page section reference with order
 */
export interface PageSectionRef {
  readonly sectionId: string;
  readonly order: number;
  readonly isEnabled: boolean;
  readonly customSettings?: Record<string, unknown>;
  readonly section?: SectionData; // Populated section data
}

/**
 * Page template configuration
 */
export interface PageTemplate {
  readonly templateId: string;
  readonly templateName: string;
  readonly variables?: Record<string, unknown>;
  readonly customizations?: Record<string, unknown>;
}

/**
 * Base page data structure
 */
export interface BasePageData {
  readonly _id: string;
  readonly slug: string;
  readonly title: MultiLanguageText;
  readonly content?: MultiLanguageText;
  readonly excerpt?: MultiLanguageText;
  readonly featuredImage?: string;
  readonly featuredImageAlt?: MultiLanguageText;
  readonly status: PageStatus;
  readonly visibility: PageVisibility;
  readonly layout: PageLayout;
  readonly tenantId: string;
  readonly departmentId?: string;
  readonly authorId: string;
  readonly lastModifiedBy?: string;
  readonly publishedAt?: Date;
  readonly scheduledAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly version: number;
  
  // Section integration
  readonly sections: readonly PageSectionRef[];
  
  // SEO and metadata
  readonly seo?: PageSEO;
  readonly analytics?: PageAnalytics;
  readonly access?: PageAccess;
  readonly navigation?: PageNavigation;
  readonly template?: PageTemplate;
  
  // Custom fields
  readonly customFields?: Record<string, unknown>;
  readonly tags?: string[];
  readonly categories?: string[];
}

/**
 * Page with populated section data
 */
export interface PopulatedPageData extends Omit<BasePageData, 'sections'> {
  readonly sections: readonly (PageSectionRef & { section: SectionData })[];
}

/**
 * Page creation data
 */
export type PageCreateData = Omit<
  BasePageData,
  '_id' | 'createdAt' | 'updatedAt' | 'version' | 'authorId' | 'lastModifiedBy'
> & {
  readonly authorId?: string; // Optional on creation, will be set from auth
};

/**
 * Page update data
 */
export type PageUpdateData = Partial<
  Omit<PageCreateData, 'tenantId' | 'slug'>
> & {
  readonly lastModifiedBy?: string; // Will be set from auth
};

/**
 * Page list result with pagination
 */
export interface PageListResult {
  readonly pages: readonly BasePageData[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore: boolean;
}

/**
 * Page search and filter options
 */
export interface PageListOptions {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: PageStatus;
  readonly visibility?: PageVisibility;
  readonly layout?: PageLayout;
  readonly authorId?: string;
  readonly departmentId?: string;
  readonly tags?: string[];
  readonly categories?: string[];
  readonly search?: string;
  readonly sectionType?: SectionType;
  readonly sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'slug';
  readonly sortOrder?: 'asc' | 'desc';
  readonly includeArchived?: boolean;
  readonly includeScheduled?: boolean;
}

/**
 * Page validation result
 */
export interface PageValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly warnings?: string[];
}

/**
 * Page copy/clone options
 */
export interface PageCopyOptions {
  readonly newSlug?: string;
  readonly newTitle?: MultiLanguageText;
  readonly targetTenantId?: string;
  readonly targetDepartmentId?: string;
  readonly copySections?: boolean;
  readonly newStatus?: PageStatus;
  readonly preserveAuthor?: boolean;
}

/**
 * Page section management
 */
export interface PageSectionOperation {
  readonly type: 'add' | 'remove' | 'reorder' | 'update';
  readonly sectionId?: string;
  readonly order?: number;
  readonly settings?: Record<string, unknown>;
  readonly isEnabled?: boolean;
}

/**
 * Page service interface
 */
export interface PageService {
  createPage(pageData: PageCreateData): Promise<BasePageData>;
  updatePage(id: string, pageData: PageUpdateData): Promise<BasePageData>;
  deletePage(id: string): Promise<boolean>;
  getPageById(id: string, populate?: boolean): Promise<BasePageData | PopulatedPageData | null>;
  getPageBySlug(slug: string, tenantId: string, populate?: boolean): Promise<BasePageData | PopulatedPageData | null>;
  getPagesByTenant(tenantId: string, options?: PageListOptions): Promise<PageListResult>;
  getPublicPages(tenantId: string): Promise<BasePageData[]>;
  duplicatePage(id: string, options?: PageCopyOptions): Promise<BasePageData>;
  copyPage(id: string, targetTenantId: string, options?: PageCopyOptions): Promise<BasePageData>;
  manageSections(pageId: string, operations: PageSectionOperation[]): Promise<BasePageData>;
  publishPage(id: string, scheduledAt?: Date): Promise<BasePageData>;
  unpublishPage(id: string): Promise<BasePageData>;
  archivePage(id: string): Promise<BasePageData>;
}

/**
 * Page builder state
 */
export interface PageBuilderState {
  readonly page: BasePageData;
  readonly sections: SectionData[];
  readonly selectedSectionId?: string;
  readonly isDirty: boolean;
  readonly isLoading: boolean;
  readonly errors: string[];
}

/**
 * Page builder actions
 */
export type PageBuilderAction =
  | { type: 'SET_PAGE'; payload: BasePageData }
  | { type: 'UPDATE_PAGE'; payload: Partial<BasePageData> }
  | { type: 'SET_SECTIONS'; payload: SectionData[] }
  | { type: 'ADD_SECTION'; payload: { section: SectionData; order: number } }
  | { type: 'REMOVE_SECTION'; payload: string }
  | { type: 'REORDER_SECTIONS'; payload: { sectionId: string; newOrder: number } }
  | { type: 'SELECT_SECTION'; payload: string | undefined }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERRORS'; payload: string[] }
  | { type: 'SET_DIRTY'; payload: boolean };

/**
 * Page template definitions
 */
export interface PageTemplateDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly layout: PageLayout;
  readonly defaultSections: readonly {
    readonly type: SectionType;
    readonly order: number;
    readonly defaultData: Record<string, unknown>;
  }[];
  readonly customFields?: Record<string, unknown>;
  readonly seo?: Partial<PageSEO>;
  readonly preview?: string;
  readonly category: 'landing' | 'content' | 'product' | 'blog' | 'university' | 'custom';
}

/**
 * Pre-defined page templates
 */
export const PAGE_TEMPLATES: readonly PageTemplateDefinition[] = [
  {
    id: 'landing-hero-cta',
    name: 'Landing Page with Hero & CTA',
    description: 'Perfect for product launches and marketing campaigns',
    layout: 'full-width',
    defaultSections: [
      { type: 'hero', order: 1, defaultData: { height: 'large', textAlignment: 'center' } },
      { type: 'featureList', order: 2, defaultData: { layout: 'grid', columns: 3 } },
      { type: 'cta', order: 3, defaultData: { layout: 'centered' } }
    ],
    category: 'landing'
  },
  {
    id: 'about-page',
    name: 'About Us Page',
    description: 'Company information with team and values',
    layout: 'default',
    defaultSections: [
      { type: 'contentWithImage', order: 1, defaultData: { imagePosition: 'right' } },
      { type: 'rector', order: 2, defaultData: { layout: 'card' } },
      { type: 'organizationStructure', order: 3, defaultData: { layout: 'grid', showImages: true } }
    ],
    category: 'content'
  },
  {
    id: 'pricing-page',
    name: 'Pricing Page',
    description: 'Showcase pricing plans and features',
    layout: 'default',
    defaultSections: [
      { type: 'hero', order: 1, defaultData: { height: 'medium', textAlignment: 'center' } },
      { type: 'pricing', order: 2, defaultData: { layout: 'cards' } },
      { type: 'faq', order: 3, defaultData: { layout: 'accordion', searchable: true } },
      { type: 'cta', order: 4, defaultData: { layout: 'centered' } }
    ],
    category: 'product'
  },
  {
    id: 'university-home',
    name: 'University Homepage',
    description: 'Complete university homepage with enrollment and rector info',
    layout: 'default',
    defaultSections: [
      { type: 'hero', order: 1, defaultData: { height: 'large', textAlignment: 'center' } },
      { type: 'studentEnrollment', order: 2, defaultData: { layout: 'grid', columns: 4 } },
      { type: 'rector', order: 3, defaultData: { layout: 'banner' } },
      { type: 'featureList', order: 4, defaultData: { layout: 'grid', columns: 3 } },
      { type: 'gallery', order: 5, defaultData: { layout: 'grid', columns: 3, enableLightbox: true } }
    ],
    category: 'university'
  },
  {
    id: 'content-simple',
    name: 'Simple Content Page',
    description: 'Basic content page with optional sections',
    layout: 'default',
    defaultSections: [
      { type: 'contentWithImage', order: 1, defaultData: { imagePosition: 'top' } }
    ],
    category: 'content'
  }
] as const;

/**
 * Type guards for page types
 */
export function isPublishedPage(page: BasePageData): boolean {
  return page.status === 'Published' && 
         page.visibility !== 'Private' &&
         (!page.publishedAt || page.publishedAt <= new Date());
}

export function isScheduledPage(page: BasePageData): boolean {
  return page.status === 'Scheduled' && 
         page.scheduledAt !== undefined &&
         page.scheduledAt > new Date();
}

export function isPublicPage(page: BasePageData): boolean {
  return isPublishedPage(page) && 
         page.visibility === 'Public' &&
         (!page.access?.requireAuth || page.access.requireAuth === false);
}

export function hasPageAccess(page: BasePageData, user?: User): boolean {
  if (isPublicPage(page)) return true;
  
  if (!user) return false;
  
  if (page.access?.allowedUsers?.includes(user.id)) return true;
  
  if (page.access?.allowedRoles?.some(role => user.roles?.includes(role))) return true;
  
  return false;
}

/**
 * Utility functions for pages
 */
export function generatePageSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100);
}

export function getPageUrl(page: BasePageData, domain?: string): string {
  const baseUrl = domain || '';
  return `${baseUrl}/${page.slug}`;
}

export function getPageEditUrl(page: BasePageData, adminDomain?: string): string {
  const baseUrl = adminDomain || '/admin';
  return `${baseUrl}/pages/${page._id}/edit`;
}

export function getPagePreviewUrl(page: BasePageData, domain?: string): string {
  const baseUrl = domain || '';
  return `${baseUrl}/preview/${page.slug}`;
}