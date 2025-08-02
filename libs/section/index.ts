// Main entry point for section library
export * from './server';
export * from './client';
export * from './components';
export * from './renderer';

// Re-export section types from centralized location
export * from '../types/section';

// Re-export MultiLanguageText for convenience  
export type { MultiLanguageText } from '../types';

// All types are now exported from '../types/section' above

// Re-export commonly used functions
export {
  sectionManager,
  createSection,
  updateSection,
  deleteSection,
  getSectionById,
  getSectionsByType,
  getSectionsByTenant,
  duplicateSection,
  copySection,
  reorderSections,
  getPublicSections,
  validateSection
} from './server';

export {
  sectionClient,
  createSection as createSectionClient,
  updateSection as updateSectionClient,
  deleteSection as deleteSectionClient,
  getSectionById as getSectionByIdClient,
  getSectionsByType as getSectionsByTypeClient,
  getSections as getSectionsClient,
  getSectionList,
  duplicateSection as duplicateSectionClient,
  copySection as copySectionClient,
  reorderSections as reorderSectionsClient,
  getPublicSections as getPublicSectionsClient,
  getLocalizedText,
  validateSectionData,
  isSectionPublic,
  sortSectionsByOrder,
  filterSectionsByType,
  groupSectionsByType,
  searchSections,
  formatSectionForDisplay,
  getSectionPreviewUrl
} from './client';

export {
  registerSectionComponent,
  getSectionComponent,
  getRegisteredSectionTypes,
  isSectionComponentRegistered,
  clearSectionComponentRegistry,
  buildSectionClasses,
  buildSectionStyles,
  getSectionContainerProps,
  getLocalizedText as getLocalizedTextComponent,
  hasLocalizedText,
  getAvailableLanguages,
  getButtonProps,
  getImageProps,
  getResponsiveImageProps,
  getGridClasses,
  getFlexClasses,
  createSectionVisibilityObserver,
  scrollToSection,
  trackSectionView,
  trackSectionInteraction,
  getSectionAriaProps,
  getSectionHeadingId,
  shouldHaveLandmarkRole
} from './components';

export {
  SectionRenderer,
  SectionListRenderer,
  useSectionVisibility,
  useSectionIntersection
} from './renderer';

// Type guards are now exported from '../types/section' above

// Constants are now exported from '../types/section' above

// Version
export const SECTION_LIBRARY_VERSION = '1.0.0';

/**
 * Default configuration for the section library
 */
export const DEFAULT_SECTION_CONFIG = {
  language: 'en',
  fallbackLanguage: 'en',
  trackAnalytics: false,
  editMode: false,
  cacheEnabled: true,
  cacheTtl: 3600,
  enablePermissionCheck: true
} as const;

/**
 * Initialize section library with default components
 * This function can be called to set up basic section components
 */
export function initializeSectionLibrary(config: Partial<typeof DEFAULT_SECTION_CONFIG> = {}) {
  const finalConfig = { ...DEFAULT_SECTION_CONFIG, ...config };
  
  // Store config globally (you might want to use a context or store)
  if (typeof window !== 'undefined') {
    (window as any).__SECTION_CONFIG__ = finalConfig;
  }
  
  return finalConfig;
}

/**
 * Get current section library configuration
 */
export function getSectionLibraryConfig(): typeof DEFAULT_SECTION_CONFIG {
  if (typeof window !== 'undefined' && (window as any).__SECTION_CONFIG__) {
    return (window as any).__SECTION_CONFIG__;
  }
  return DEFAULT_SECTION_CONFIG;
}

/**
 * Utility to create a section with default values
 */
export function createSectionData<T extends SectionType>(
  type: T,
  data: Partial<SectionCreateData<T>>
): SectionCreateData<T> {
  const baseDefaults = {
    name: `New ${type} Section`,
    title: { en: `New ${type} Section`, mm: `New ${type} Section` },
    order: 0,
    isVisible: true,
    isReusable: false,
    status: 'Active' as const,
    version: 1,
    createdBy: 'system',
    customStyles: {},
    customClasses: []
  };

  return {
    type,
    ...baseDefaults,
    ...data
  } as SectionCreateData<T>;
}

/**
 * Utility to merge section data updates
 */
export function mergeSectionUpdate<T extends SectionType>(
  original: Extract<SectionData, { type: T }>,
  update: SectionUpdateData<T>
): Extract<SectionData, { type: T }> {
  return {
    ...original,
    ...update,
    updatedAt: new Date(),
    version: original.version + 1
  } as Extract<SectionData, { type: T }>;
}

/**
 * Utility to clone a section for duplication
 */
export function cloneSectionData(
  section: SectionData,
  overrides: Partial<SectionCreateData> = {}
): SectionCreateData {
  const { _id, createdAt, updatedAt, version, ...cloneableData } = section;
  
  return {
    ...cloneableData,
    name: `${section.name} (Copy)`,
    title: {
      en: `${section.title.en} (Copy)`,
      mm: `${section.title.mm} (Copy)`,
      ...section.title
    },
    order: section.order + 1,
    version: 1,
    ...overrides
  } as SectionCreateData;
}

/**
 * Utility to validate section data structure
 */
export function validateSectionStructure(data: any): data is SectionData {
  if (!data || typeof data !== 'object') return false;
  
  const requiredFields = [
    '_id', 'name', 'title', 'type', 'order', 'isVisible', 'isReusable',
    'tenantId', 'status', 'version', 'createdBy', 'createdAt', 'updatedAt'
  ];
  
  return requiredFields.every(field => field in data) &&
         typeof data.title === 'object' &&
         'en' in data.title &&
         typeof data.title.en === 'string';
}

/**
 * Utility to get section type display name
 */
export function getSectionTypeDisplayName(type: SectionType): string {
  const displayNames: Record<SectionType, string> = {
    hero: 'Hero Section',
    featureList: 'Feature List',
    contentWithImage: 'Content with Image',
    cta: 'Call to Action',
    testimonials: 'Testimonials',
    gallery: 'Gallery',
    faq: 'FAQ',
    pricing: 'Pricing',
    dataTable: 'Data Table',
    studentEnrollment: 'Student Enrollment',
    rector: 'Rector Profile',
    organizationStructure: 'Organization Structure'
  };
  
  return displayNames[type] || type;
}

/**
 * Utility to get section category
 */
export function getSectionCategory(type: SectionType): string {
  const categories: Record<SectionType, string> = {
    hero: 'content',
    featureList: 'content',
    contentWithImage: 'content',
    cta: 'marketing',
    testimonials: 'marketing',
    gallery: 'content',
    faq: 'content',
    pricing: 'marketing',
    dataTable: 'data',
    studentEnrollment: 'university',
    rector: 'university',
    organizationStructure: 'university'
  };
  
  return categories[type] || 'content';
}