// Section component utilities and helpers
import type { SectionData, SectionType, MultiLanguageText } from '../types/section';

/**
 * Component registration and rendering utilities
 */

/**
 * Section component registry
 */
type SectionComponent<T extends SectionData = SectionData> = React.ComponentType<{
  section: T;
  language?: string;
  className?: string;
  style?: React.CSSProperties;
}>;

type SectionComponentRegistry = {
  [K in SectionType]: SectionComponent<Extract<SectionData, { type: K }>>;
};

// Global component registry
const componentRegistry: Partial<SectionComponentRegistry> = {};

/**
 * Register a section component
 */
export function registerSectionComponent<T extends SectionType>(
  type: T,
  component: SectionComponent<Extract<SectionData, { type: T }>>
): void {
  componentRegistry[type] = component as any;
}

/**
 * Get registered component for section type
 */
export function getSectionComponent<T extends SectionType>(
  type: T
): SectionComponent<Extract<SectionData, { type: T }>> | null {
  return (componentRegistry[type] as SectionComponent<Extract<SectionData, { type: T }>>) || null;
}

/**
 * Get all registered component types
 */
export function getRegisteredSectionTypes(): SectionType[] {
  return Object.keys(componentRegistry) as SectionType[];
}

/**
 * Check if component is registered for section type
 */
export function isSectionComponentRegistered(type: SectionType): boolean {
  return type in componentRegistry;
}

/**
 * Clear all registered components
 */
export function clearSectionComponentRegistry(): void {
  Object.keys(componentRegistry).forEach(key => {
    delete componentRegistry[key as SectionType];
  });
}

/**
 * Section styling utilities
 */

/**
 * CSS class builder for sections
 */
export function buildSectionClasses(
  section: SectionData,
  additionalClasses: string[] = []
): string {
  const classes = [
    'section',
    `section-${section.type}`,
    `section-${section._id}`,
    ...additionalClasses
  ];

  // Add custom classes from section data
  if (section.customClasses) {
    classes.push(...section.customClasses);
  }

  // Add visibility class
  if (!section.isVisible) {
    classes.push('section-hidden');
  }

  // Add status class
  classes.push(`section-${section.status.toLowerCase()}`);

  return classes.filter(Boolean).join(' ');
}

/**
 * Generate inline styles for section
 */
export function buildSectionStyles(section: SectionData): React.CSSProperties {
  const styles: React.CSSProperties = {};

  // Apply spacing if defined
  if (section.spacing) {
    styles.paddingTop = section.spacing.paddingTop;
    styles.paddingBottom = section.spacing.paddingBottom;
    styles.marginTop = section.spacing.marginTop;
    styles.marginBottom = section.spacing.marginBottom;
  }

  // Apply custom styles
  if (section.customStyles) {
    Object.assign(styles, section.customStyles);
  }

  return styles;
}

/**
 * Section layout utilities
 */

/**
 * Container component for sections
 */
export interface SectionContainerProps {
  section: SectionData;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  language?: string;
}

/**
 * Generate section container props
 */
export function getSectionContainerProps(
  section: SectionData,
  additionalProps: Partial<SectionContainerProps> = {}
): SectionContainerProps {
  return {
    section,
    className: buildSectionClasses(section, additionalProps.className ? [additionalProps.className] : []),
    style: { ...buildSectionStyles(section), ...additionalProps.style },
    language: additionalProps.language || 'en',
    children: additionalProps.children || null
  };
}

/**
 * Text and content utilities
 */

/**
 * Get localized text with fallback
 */
export function getLocalizedText(
  text: MultiLanguageText | string,
  language: string = 'en',
  fallback: string = 'en'
): string {
  if (typeof text === 'string') {
    return text;
  }

  return text[language] || text[fallback] || text.en || Object.values(text)[0] || '';
}

/**
 * Check if text content exists for language
 */
export function hasLocalizedText(
  text: MultiLanguageText | string,
  language: string
): boolean {
  if (typeof text === 'string') {
    return text.length > 0;
  }

  return Boolean(text[language] && text[language].trim().length > 0);
}

/**
 * Get available languages for text content
 */
export function getAvailableLanguages(text: MultiLanguageText): string[] {
  return Object.keys(text).filter(lang => text[lang] && text[lang].trim().length > 0);
}

/**
 * Button component utilities
 */

/**
 * Generate button props from section button data
 */
export function getButtonProps(
  button: { text: MultiLanguageText; url: string; openInNewTab: boolean },
  language: string = 'en'
) {
  return {
    href: button.url,
    target: button.openInNewTab ? '_blank' : undefined,
    rel: button.openInNewTab ? 'noopener noreferrer' : undefined,
    children: getLocalizedText(button.text, language)
  };
}

/**
 * Image utilities
 */

/**
 * Generate image props with alt text and optimization
 */
export function getImageProps(
  src: string,
  alt: MultiLanguageText | string,
  language: string = 'en'
) {
  return {
    src,
    alt: getLocalizedText(alt, language),
    loading: 'lazy' as const,
    decoding: 'async' as const
  };
}

/**
 * Responsive image utilities
 */
export function getResponsiveImageProps(
  src: string,
  alt: MultiLanguageText | string,
  sizes: string = '100vw',
  language: string = 'en'
) {
  return {
    ...getImageProps(src, alt, language),
    sizes,
    style: { width: '100%', height: 'auto' }
  };
}

/**
 * Layout utilities
 */

/**
 * Grid layout classes
 */
export function getGridClasses(columns: number, responsive: boolean = true): string {
  const classes = [`grid-cols-${columns}`];
  
  if (responsive) {
    if (columns > 2) {
      classes.unshift('grid-cols-1', 'md:grid-cols-2');
    } else if (columns === 2) {
      classes.unshift('grid-cols-1');
    }
  }
  
  return `grid ${classes.map(cls => cls.includes(':') ? cls : `lg:${cls}`).join(' ')} gap-6`;
}

/**
 * Flex layout classes
 */
export function getFlexClasses(
  direction: 'row' | 'col' = 'row',
  justify: 'start' | 'center' | 'end' | 'between' | 'around' = 'start',
  align: 'start' | 'center' | 'end' | 'stretch' = 'start',
  wrap: boolean = false
): string {
  const classes = [
    'flex',
    `flex-${direction}`,
    `justify-${justify}`,
    `items-${align}`
  ];

  if (wrap) {
    classes.push('flex-wrap');
  }

  return classes.join(' ');
}

/**
 * Animation and interaction utilities
 */

/**
 * Intersection observer hook for section visibility
 */
export function createSectionVisibilityObserver(
  callback: (sectionId: string, isVisible: boolean) => void,
  options: IntersectionObserverInit = {}
) {
  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const sectionId = entry.target.getAttribute('data-section-id');
      if (sectionId) {
        callback(sectionId, entry.isIntersecting);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -10% 0px',
    ...options
  });
}

/**
 * Smooth scroll to section
 */
export function scrollToSection(sectionId: string, behavior: ScrollBehavior = 'smooth'): void {
  const element = document.querySelector(`[data-section-id="${sectionId}"]`);
  if (element) {
    element.scrollIntoView({ behavior, block: 'start' });
  }
}

/**
 * Section analytics utilities
 */

/**
 * Track section view event
 */
export function trackSectionView(section: SectionData, language: string = 'en'): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'section_view', {
      section_id: section._id,
      section_type: section.type,
      section_name: section.name,
      section_title: getLocalizedText(section.title, language),
      language
    });
  }
}

/**
 * Track section interaction event
 */
export function trackSectionInteraction(
  section: SectionData,
  action: string,
  target?: string,
  language: string = 'en'
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'section_interaction', {
      section_id: section._id,
      section_type: section.type,
      action,
      target,
      language
    });
  }
}

/**
 * Accessibility utilities
 */

/**
 * Generate ARIA attributes for section
 */
export function getSectionAriaProps(section: SectionData, language: string = 'en') {
  return {
    'aria-label': getLocalizedText(section.title, language),
    'data-section-id': section._id,
    'data-section-type': section.type,
    role: 'region'
  };
}

/**
 * Generate heading ID for section
 */
export function getSectionHeadingId(section: SectionData): string {
  return `section-${section._id}-heading`;
}

/**
 * Check if section should have landmark role
 */
export function shouldHaveLandmarkRole(sectionType: SectionType): boolean {
  const landmarkSections: SectionType[] = ['hero', 'cta'];
  return landmarkSections.includes(sectionType);
}