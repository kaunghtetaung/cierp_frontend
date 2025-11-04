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
  OrganizationStructureSectionData
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

export function isAppListSection(section: SectionData): section is AppListSectionData {
  return section.type === 'appList';
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
 */
export function filterEnabledSections(sections: SectionData[]): SectionData[] {
  return sections.filter(section => section.isEnabled);
}

/**
 * Get processed sections (sorted and filtered)
 */
export function getProcessedSections(sections: SectionData[]): SectionData[] {
  return sortSectionsByOrder(filterEnabledSections(sections));
}