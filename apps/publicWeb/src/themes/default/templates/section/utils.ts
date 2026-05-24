// Section utilities
// Helper functions for section components

import {
  SectionData,
  MultiLanguageText,
  HeroSectionData,
  ContentWithImageSectionData,
  FeatureListSectionData,
  CallToActionSectionData,
  GallerySectionData,
  TestimonialsSectionData,
  FaqSectionData,
  PricingSectionData,
  DataTableSectionData,
  OrganizationStructureSectionData,
  CarouselSectionData,
  RecentPostsSectionData,
  StatsSectionData,
  CategoryListSectionData,
  TagListSectionData,
  PostBodySectionData,
  NavigationMenuSectionData,
  TabsSectionData,
  StudentEnrollmentSectionData,
  RectorSectionData,
} from './types';
import { AppListSectionData } from './applist/AppListSection';

/**
 * Get localized text from MultiLanguageText object
 */
export function getLocalizedText(
  text: MultiLanguageText | undefined, 
  language: 'en' | 'mm' = 'en'
): string {
  if (!text) return '';
  return text[language] || text.en || '';
}

/**
 * Generate CSS classes for section wrapper
 */
export function getSectionClasses(section: SectionData): string {
  const classes = [
    'section-wrapper',
    `section-${section.type}`,
    `section-order-${section.order}`,
  ];

  if (section.customClasses) {
    classes.push(...section.customClasses);
  }

  if (!section.isEnabled) {
    classes.push('section-disabled');
  }

  return classes.join(' ');
}

/**
 * Type guard functions for section types
 */
export function isHeroSection(section: SectionData): section is HeroSectionData {
  return section.type === 'hero';
}

export function isContentWithImageSection(section: SectionData): section is ContentWithImageSectionData {
  return section.type === 'contentWithImage';
}

export function isFeatureListSection(section: SectionData): section is FeatureListSectionData {
  return section.type === 'featureList';
}

export function isCallToActionSection(section: SectionData): section is CallToActionSectionData {
  return section.type === 'cta';
}

export function isGallerySection(section: SectionData): section is GallerySectionData {
  return section.type === 'gallery';
}

export function isTestimonialsSection(section: SectionData): section is TestimonialsSectionData {
  return section.type === 'testimonials';
}

export function isFaqSection(section: SectionData): section is FaqSectionData {
  return section.type === 'faq';
}

export function isPricingSection(section: SectionData): section is PricingSectionData {
  return section.type === 'pricing';
}

export function isDataTableSection(section: SectionData): section is DataTableSectionData {
  return section.type === 'dataTable';
}

export function isOrganizationStructureSection(section: SectionData): section is OrganizationStructureSectionData {
  return section.type === 'organizationStructure';
}

export function isStatusColorsShowcase(section: SectionData): boolean {
  return (section as any).type === 'statusColorsShowcase';
}

// `appList` lives outside the main SectionData union (it's defined in
// its own component file). Use a permissive parameter type so the type
// predicate doesn't try to prove `AppListSectionData` extends `SectionData`.
export function isAppListSection(section: unknown): section is AppListSectionData {
  return (section as { type?: string })?.type === 'appList';
}

export function isCarouselSection(section: SectionData): section is CarouselSectionData {
  return section.type === 'carousel';
}

export function isRecentPostsSection(section: SectionData): section is RecentPostsSectionData {
  return section.type === 'recentPosts';
}

export function isStatsSection(section: SectionData): section is StatsSectionData {
  return section.type === 'stats';
}

export function isCategoryListSection(
  section: SectionData,
): section is CategoryListSectionData {
  return section.type === 'categoryList';
}

export function isTagListSection(
  section: SectionData,
): section is TagListSectionData {
  return section.type === 'tagList';
}

export function isPostBodySection(
  section: SectionData,
): section is PostBodySectionData {
  return section.type === 'postBody';
}

export function isNavigationMenuSection(
  section: SectionData,
): section is NavigationMenuSectionData {
  return section.type === 'navigationMenu';
}

export function isTabsSection(
  section: SectionData,
): section is TabsSectionData {
  return section.type === 'tabs';
}

export function isStudentEnrollmentSection(
  section: SectionData,
): section is StudentEnrollmentSectionData {
  return section.type === 'studentEnrollment';
}

export function isRectorSection(
  section: SectionData,
): section is RectorSectionData {
  return section.type === 'rector';
}

/**
 * Get button variant class
 */
export function getButtonVariant(style: 'primary' | 'secondary' | 'outline'): string {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    outline: 'btn-outline'
  };
  
  return variants[style] || variants.primary;
}

/**
 * Get grid columns class
 */
export function getGridColumns(columns: 2 | 3 | 4): string {
  const gridClasses = {
    2: 'grid-2-cols',
    3: 'grid-3-cols',
    4: 'grid-4-cols'
  };
  
  return gridClasses[columns] || gridClasses[3];
}

/**
 * Sort sections by order
 */
export function sortSectionsByOrder(sections: SectionData[]): SectionData[] {
  return [...sections].sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    return orderA - orderB;
  });
}

/**
 * Filter enabled sections
 *
 * Accepts THREE shapes:
 *   - Legacy dummy data (`isEnabled: boolean`).
 *   - DB-authored sections (`isVisible: boolean`, `status: 'Active' | 'Inactive'`).
 *   - Older admin docs missing both flags — assumed visible.
 *
 * Only EXPLICIT negatives drop a section; missing flags pass through
 * so older content keeps rendering until it's re-saved with the new
 * shape.
 */
export function filterEnabledSections(sections: SectionData[]): SectionData[] {
  return sections.filter((section) => {
    const s = section as any;
    if (s?.isEnabled === false) return false;
    if (s?.isVisible === false) return false;
    if (s?.status && s.status !== 'Active') return false;
    return true;
  });
}

/**
 * Get processed sections (sorted and filtered)
 */
export function getProcessedSections(sections: SectionData[]): SectionData[] {
  return sortSectionsByOrder(filterEnabledSections(sections));
}