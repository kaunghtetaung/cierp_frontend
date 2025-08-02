// Section components export
// Centralized export for all section components

// Main renderer
export { default as SectionRenderer } from './SectionRenderer';

// Individual section components
export { default as HeroSection } from './hero/HeroSection';
export { default as ContentWithImageSection } from './content/ContentWithImageSection';
export { default as FeatureListSection } from './feature/FeatureListSection';
export { default as CallToActionSection } from './cta/CallToActionSection';
export { default as GallerySection } from './gallery/GallerySection';
export { default as StatusColorsShowcase } from './showcase/StatusColorsShowcase';

// Types and utilities
export type {
  SectionData,
  SectionProps,
  SectionRendererProps,
  BaseSection,
  HeroSectionData,
  ContentWithImageSectionData,
  FeatureListSectionData,
  CallToActionSectionData,
  GallerySectionData,
  MultiLanguageText
} from './types';

export {
  getLocalizedText,
  getSectionClasses,
  getButtonVariant,
  getGridColumns,
  sortSectionsByOrder,
  filterEnabledSections,
  getProcessedSections,
  isHeroSection,
  isContentWithImageSection,
  isFeatureListSection,
  isCallToActionSection,
  isGallerySection
} from './utils';