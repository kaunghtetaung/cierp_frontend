// Section type definitions with discriminated unions
import type { MultiLanguageText } from "./common";

/**
 * Section layout and styling
 */
export interface SectionSpacing {
  readonly paddingTop: string;
  readonly paddingBottom: string;
  readonly marginTop: string;
  readonly marginBottom: string;
}

export interface SectionOverlay {
  readonly enabled: boolean;
  readonly color: string;
  readonly opacity: number;
}

/**
 * Base section data that all sections extend
 */
export interface BaseSectionData {
  readonly _id: string;
  readonly name: string;
  readonly title: MultiLanguageText;
  readonly order: number;
  readonly isVisible: boolean;
  readonly isEnabled: boolean;
  readonly isReusable: boolean;
  readonly tenantId: string; // Updated from organizationId for multi-tenant
  readonly departmentId?: string;
  readonly status: "Active" | "Inactive";
  readonly version: number;
  readonly createdBy: string;
  readonly updatedBy?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly customStyles?: Record<string, unknown>;
  readonly customClasses?: string[];
  readonly spacing?: SectionSpacing;
}

/**
 * Button configuration for CTAs
 */
export interface SectionButton {
  readonly text: MultiLanguageText;
  readonly url: string;
  readonly style: "primary" | "secondary" | "outline";
  readonly openInNewTab: boolean;
  readonly icon?: string;
}

/**
 * Hero Section
 */
export interface HeroSectionData extends BaseSectionData {
  readonly type: "hero";
  readonly headline: MultiLanguageText;
  readonly subheadline?: MultiLanguageText;
  readonly backgroundImage?: string;
  readonly backgroundVideo?: string;
  readonly overlay?: SectionOverlay;
  readonly buttons: readonly SectionButton[];
  readonly textAlignment: "left" | "center" | "right";
  readonly height: "small" | "medium" | "large" | "fullscreen";
}

/**
 * Feature List Section
 */
export interface FeatureItem {
  readonly title: MultiLanguageText;
  readonly description: MultiLanguageText;
  readonly icon: string;
  readonly link?: string;
}

export interface FeatureListSectionData extends BaseSectionData {
  readonly type: "featureList";
  readonly headline?: MultiLanguageText;
  readonly description?: MultiLanguageText;
  readonly features: readonly FeatureItem[];
  readonly layout: "grid" | "list" | "carousel";
  readonly columns: 1 | 2 | 3 | 4;
}

/**
 * Content with Image Section
 */
export interface ContentWithImageSectionData extends BaseSectionData {
  readonly type: "contentWithImage";
  readonly headline: MultiLanguageText;
  readonly content: MultiLanguageText;
  readonly image: string;
  readonly imagePosition: "left" | "right" | "top" | "bottom";
  readonly imageAlt: MultiLanguageText;
  readonly buttons?: readonly SectionButton[];
}

/**
 * Call to Action Section
 */
export interface CTASectionData extends BaseSectionData {
  readonly type: "cta";
  readonly headline: MultiLanguageText;
  readonly description?: MultiLanguageText;
  readonly backgroundColor?: string;
  readonly textColor?: string;
  readonly buttons: readonly SectionButton[];
  readonly layout: "centered" | "split" | "banner";
}

/**
 * Testimonials Section
 */
export interface TestimonialItem {
  readonly name: string;
  readonly title: string;
  readonly company: string;
  readonly content: MultiLanguageText;
  readonly avatar?: string;
  readonly rating?: number;
}

export interface TestimonialsSectionData extends BaseSectionData {
  readonly type: "testimonials";
  readonly headline?: MultiLanguageText;
  readonly testimonials: readonly TestimonialItem[];
  readonly layout: "grid" | "carousel" | "masonry";
  readonly showRating: boolean;
}

/**
 * Gallery Section
 */
export interface GalleryItem {
  readonly src: string;
  readonly alt: MultiLanguageText;
  readonly caption?: MultiLanguageText;
  readonly link?: string;
}

export interface GallerySectionData extends BaseSectionData {
  readonly type: "gallery";
  readonly headline?: MultiLanguageText;
  readonly images: readonly GalleryItem[];
  readonly layout: "grid" | "masonry" | "carousel";
  readonly columns: 2 | 3 | 4 | 5;
  readonly enableLightbox: boolean;
}

/**
 * FAQ Section
 */
export interface FAQItem {
  readonly question: MultiLanguageText;
  readonly answer: MultiLanguageText;
  readonly category?: string;
}

export interface FAQSectionData extends BaseSectionData {
  readonly type: "faq";
  readonly headline?: MultiLanguageText;
  readonly description?: MultiLanguageText;
  readonly faqs: readonly FAQItem[];
  readonly layout: "accordion" | "tabs" | "grid";
  readonly searchable: boolean;
}

/**
 * Pricing Section
 */
export interface PricingFeature {
  readonly name: MultiLanguageText;
  readonly included: boolean;
  readonly description?: MultiLanguageText;
}

export interface PricingPlan {
  readonly name: MultiLanguageText;
  readonly description: MultiLanguageText;
  readonly price: number;
  readonly currency: string;
  readonly period: "month" | "year" | "one-time";
  readonly features: readonly PricingFeature[];
  readonly highlighted: boolean;
  readonly button: SectionButton;
}

export interface PricingSectionData extends BaseSectionData {
  readonly type: "pricing";
  readonly headline?: MultiLanguageText;
  readonly description?: MultiLanguageText;
  readonly plans: readonly PricingPlan[];
  readonly layout: "cards" | "table" | "comparison";
}

/**
 * Data Table Section
 */
export interface DataTableColumn {
  readonly key: string;
  readonly title: MultiLanguageText;
  readonly type: "text" | "number" | "date" | "boolean" | "image";
  readonly sortable: boolean;
  readonly filterable: boolean;
}

export interface DataTableSectionData extends BaseSectionData {
  readonly type: "dataTable";
  readonly headline?: MultiLanguageText;
  readonly columns: readonly DataTableColumn[];
  readonly data: readonly Record<string, unknown>[];
  readonly paginated: boolean;
  readonly pageSize: number;
  readonly searchable: boolean;
  readonly exportable: boolean;
}

/**
 * Student Enrollment Section (University specific)
 */
export interface EnrollmentCard {
  readonly title: MultiLanguageText;
  readonly subTitle: MultiLanguageText;
  readonly icon: string;
  readonly count: string;
  readonly bgColor: string;
  readonly textColor: string;
}

export interface StudentEnrollmentSectionData extends BaseSectionData {
  readonly type: "studentEnrollment";
  readonly headline?: MultiLanguageText;
  readonly description?: MultiLanguageText;
  readonly enrollmentCards: readonly EnrollmentCard[];
  readonly layout: "grid" | "row";
  readonly columns: 1 | 2 | 3 | 4;
}

/**
 * Rector Section (Executive profile)
 */
export interface RectorSectionData extends BaseSectionData {
  readonly type: "rector";
  readonly rectorName: MultiLanguageText;
  readonly rectorTitle: MultiLanguageText;
  readonly bio: MultiLanguageText;
  readonly image: string;
  readonly imageAlt: MultiLanguageText;
  readonly qualifications: readonly MultiLanguageText[];
  readonly achievements: readonly MultiLanguageText[];
  readonly layout: "card" | "banner" | "sidebar";
}

/**
 * Organization Structure Section
 */
export interface OrganizationNode {
  readonly id: string;
  readonly name: MultiLanguageText;
  readonly title: MultiLanguageText;
  readonly image?: string;
  readonly parentId?: string;
  readonly children?: readonly OrganizationNode[];
}

export interface OrganizationStructureSectionData extends BaseSectionData {
  readonly type: "organizationStructure";
  readonly headline?: MultiLanguageText;
  readonly structure: readonly OrganizationNode[];
  readonly layout: "tree" | "grid" | "hierarchy";
  readonly showImages: boolean;
}

/**
 * Discriminated union of all section types
 */
export type SectionData =
  | HeroSectionData
  | FeatureListSectionData
  | ContentWithImageSectionData
  | CTASectionData
  | TestimonialsSectionData
  | GallerySectionData
  | FAQSectionData
  | PricingSectionData
  | DataTableSectionData
  | StudentEnrollmentSectionData
  | RectorSectionData
  | OrganizationStructureSectionData;

export type SectionType = SectionData["type"];

/**
 * Section creation and update data types
 */
export type SectionCreateData<T extends SectionType = SectionType> = Omit<
  Extract<SectionData, { type: T }>,
  "_id" | "createdAt" | "updatedAt" | "version"
>;

export type SectionUpdateData<T extends SectionType = SectionType> = Partial<
  Omit<SectionCreateData<T>, "type" | "tenantId">
>;

/**
 * Section service interface
 */
export interface SectionService {
  createSection(sectionData: SectionCreateData): Promise<SectionData>;
  updateSection(
    id: string,
    sectionData: SectionUpdateData
  ): Promise<SectionData>;
  deleteSection(id: string): Promise<boolean>;
  getSectionById(id: string): Promise<SectionData | null>;
  getSectionsByType(
    type: SectionType,
    tenantId: string
  ): Promise<SectionData[]>;
  getSectionsByTenant(tenantId: string): Promise<SectionData[]>;
  duplicateSection(id: string, newName?: string): Promise<SectionData>;
  reorderSections(
    sectionIds: string[],
    newOrders: number[]
  ): Promise<SectionData[]>;
  copySection(id: string, targetTenantId: string): Promise<SectionData>;
}

/**
 * Section copy/clone operations
 */
export interface SectionCopyOptions {
  readonly newName?: string;
  readonly newTitle?: MultiLanguageText;
  readonly targetTenantId?: string;
  readonly targetDepartmentId?: string;
  readonly makeReusable?: boolean;
}

/**
 * Section list with pagination
 */
export interface SectionListResult {
  readonly sections: readonly SectionData[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore: boolean;
}

/**
 * Section search and filter options
 */
export interface SectionListOptions {
  readonly page?: number;
  readonly limit?: number;
  readonly type?: SectionType;
  readonly status?: "Active" | "Inactive";
  readonly isReusable?: boolean;
  readonly departmentId?: string;
  readonly search?: string;
  readonly sortBy?: "name" | "title" | "order" | "createdAt" | "updatedAt";
  readonly sortOrder?: "asc" | "desc";
}

/**
 * Section validation result
 */
export interface SectionValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
}

/**
 * Type guards for section types
 */
export function isHeroSection(
  section: SectionData
): section is HeroSectionData {
  return section.type === "hero";
}

export function isFeatureListSection(
  section: SectionData
): section is FeatureListSectionData {
  return section.type === "featureList";
}

export function isContentWithImageSection(
  section: SectionData
): section is ContentWithImageSectionData {
  return section.type === "contentWithImage";
}

export function isCTASection(section: SectionData): section is CTASectionData {
  return section.type === "cta";
}

export function isTestimonialsSection(
  section: SectionData
): section is TestimonialsSectionData {
  return section.type === "testimonials";
}

export function isGallerySection(
  section: SectionData
): section is GallerySectionData {
  return section.type === "gallery";
}

export function isFAQSection(section: SectionData): section is FAQSectionData {
  return section.type === "faq";
}

export function isPricingSection(
  section: SectionData
): section is PricingSectionData {
  return section.type === "pricing";
}

export function isDataTableSection(
  section: SectionData
): section is DataTableSectionData {
  return section.type === "dataTable";
}

export function isStudentEnrollmentSection(
  section: SectionData
): section is StudentEnrollmentSectionData {
  return section.type === "studentEnrollment";
}

export function isRectorSection(
  section: SectionData
): section is RectorSectionData {
  return section.type === "rector";
}

export function isOrganizationStructureSection(
  section: SectionData
): section is OrganizationStructureSectionData {
  return section.type === "organizationStructure";
}

/**
 * Section template for creating new sections
 */
export interface SectionTemplate<T extends SectionType = SectionType> {
  readonly type: T;
  readonly name: string;
  readonly description: string;
  readonly defaultData: Partial<SectionCreateData<T>>;
  readonly category: "content" | "layout" | "marketing" | "data" | "university";
}

/**
 * Available section templates
 */
export const SECTION_TEMPLATES: readonly SectionTemplate[] = [
  {
    type: "hero",
    name: "Hero Section",
    description:
      "Large banner with headline, subtitle and call-to-action buttons",
    defaultData: {
      type: "hero",
      textAlignment: "center",
      height: "medium",
    } as any,
    category: "content",
  },
  {
    type: "featureList",
    name: "Feature List",
    description: "Showcase features or services in a grid or list layout",
    defaultData: {
      type: "featureList",
      layout: "grid",
      columns: 3,
    } as any,
    category: "content",
  },
  {
    type: "contentWithImage",
    name: "Content with Image",
    description: "Text content paired with an image",
    defaultData: {
      type: "contentWithImage",
      imagePosition: "right",
    } as any,
    category: "content",
  },
  {
    type: "cta",
    name: "Call to Action",
    description: "Prominent section to drive user action",
    defaultData: {
      type: "cta",
      layout: "centered",
    } as any,
    category: "marketing",
  },
  {
    type: "testimonials",
    name: "Testimonials",
    description: "Customer reviews and testimonials",
    defaultData: {
      type: "testimonials",
      layout: "grid",
      showRating: true,
    } as any,
    category: "marketing",
  },
  {
    type: "gallery",
    name: "Image Gallery",
    description: "Collection of images with lightbox support",
    defaultData: {
      type: "gallery",
      layout: "grid",
      columns: 3,
      enableLightbox: true,
    } as any,
    category: "content",
  },
  {
    type: "faq",
    name: "FAQ",
    description: "Frequently asked questions with collapsible answers",
    defaultData: {
      type: "faq",
      layout: "accordion",
      searchable: true,
    } as any,
    category: "content",
  },
  {
    type: "pricing",
    name: "Pricing Plans",
    description: "Display pricing options and feature comparisons",
    defaultData: {
      type: "pricing",
      layout: "cards",
    } as any,
    category: "marketing",
  },
  {
    type: "dataTable",
    name: "Data Table",
    description: "Interactive table with sorting and filtering",
    defaultData: {
      type: "dataTable",
      paginated: true,
      pageSize: 10,
      searchable: true,
      exportable: false,
    } as any,
    category: "data",
  },
  {
    type: "studentEnrollment",
    name: "Student Enrollment",
    description: "University enrollment statistics and cards",
    defaultData: {
      type: "studentEnrollment",
      layout: "grid",
      columns: 4,
    } as any,
    category: "university",
  },
  {
    type: "rector",
    name: "Rector Profile",
    description: "Executive or leader profile section",
    defaultData: {
      type: "rector",
      layout: "card",
    } as any,
    category: "university",
  },
  {
    type: "organizationStructure",
    name: "Organization Chart",
    description: "Hierarchical organization structure",
    defaultData: {
      type: "organizationStructure",
      layout: "tree",
      showImages: true,
    } as any,
    category: "university",
  },
] as const;
