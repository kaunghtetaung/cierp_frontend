/**
 * Section Module TypeScript Types
 * Reusable content blocks with discriminated union pattern
 */

import type {
  MultiLanguageText,
  BaseEntity,
  EntityStatus,
  PaginationQuery,
  SectionButton,
} from './common.types';

// ============================================
// SECTION TYPES
// ============================================

export type SectionType =
  | 'hero'
  | 'featureList'
  | 'contentWithImage'
  | 'cta'
  | 'testimonials'
  | 'gallery'
  | 'faq'
  | 'pricing'
  | 'dataTable'
  | 'studentEnrollment'
  | 'rector'
  | 'organizationStructure';

// ============================================
// SPACING SETTINGS
// ============================================

export interface SectionSpacing {
  paddingTop?: string;
  paddingBottom?: string;
  marginTop?: string;
  marginBottom?: string;
}

// ============================================
// BASE SECTION (common properties)
// ============================================

export interface BaseSection extends BaseEntity {
  name: string;
  title: MultiLanguageText;
  order: number;
  isVisible: boolean;
  isReusable: boolean;
  status: EntityStatus;
  customStyles?: Record<string, unknown>;
  customClasses?: string[];
  spacing?: SectionSpacing;
}

// ============================================
// HERO SECTION
// ============================================

export interface HeroOverlay {
  enabled: boolean;
  color: string;
  opacity: number;
}

export interface HeroSection extends BaseSection {
  type: 'hero';
  headline: MultiLanguageText;
  subheadline?: MultiLanguageText;
  backgroundImage?: string;
  backgroundVideo?: string;
  overlay?: HeroOverlay;
  buttons: SectionButton[];
  textAlignment: 'left' | 'center' | 'right';
  height: 'small' | 'medium' | 'large' | 'fullscreen';
}

// ============================================
// FEATURE LIST SECTION
// ============================================

export interface FeatureLink {
  url: string;
  text: MultiLanguageText;
  openInNewTab: boolean;
}

export interface FeatureItem {
  title: MultiLanguageText;
  description: MultiLanguageText;
  icon?: string;
  image?: string;
  link?: FeatureLink;
}

export interface FeatureListSection extends BaseSection {
  type: 'featureList';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  features: FeatureItem[];
  layout: 'grid' | 'list' | 'carousel';
  columns: 1 | 2 | 3 | 4;
  showIcons: boolean;
  showImages: boolean;
}

// ============================================
// CONTENT WITH IMAGE SECTION
// ============================================

export interface ContentWithImageSection extends BaseSection {
  type: 'contentWithImage';
  headline?: MultiLanguageText;
  content: MultiLanguageText;
  image: string;
  imageAlt: MultiLanguageText;
  imagePosition: 'left' | 'right';
  button?: SectionButton;
  contentAlignment: 'left' | 'center' | 'right';
  imageRatio: 'square' | 'landscape' | 'portrait';
}

// ============================================
// CTA SECTION
// ============================================

export interface CtaSection extends BaseSection {
  type: 'cta';
  headline: MultiLanguageText;
  description?: MultiLanguageText;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  buttons: SectionButton[];
  alignment: 'left' | 'center' | 'right';
  size: 'small' | 'medium' | 'large';
}

// ============================================
// TESTIMONIALS SECTION
// ============================================

export interface TestimonialAuthor {
  name: string;
  title?: string;
  company?: string;
  avatar?: string;
}

export interface Testimonial {
  quote: MultiLanguageText;
  author: TestimonialAuthor;
  rating?: number;
}

export interface TestimonialsSection extends BaseSection {
  type: 'testimonials';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  testimonials: Testimonial[];
  layout: 'grid' | 'carousel' | 'single';
  showRatings: boolean;
  showAvatars: boolean;
  autoplay?: boolean;
  autoplaySpeed?: number;
}

// ============================================
// GALLERY SECTION
// ============================================

export interface GalleryImage {
  url: string;
  alt: MultiLanguageText;
  caption?: MultiLanguageText;
  link?: string;
}

export interface GallerySection extends BaseSection {
  type: 'gallery';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  images: GalleryImage[];
  layout: 'grid' | 'masonry' | 'carousel';
  columns: 1 | 2 | 3 | 4 | 5;
  showCaptions: boolean;
  lightbox: boolean;
  aspectRatio: 'square' | 'landscape' | 'portrait' | 'auto';
}

// ============================================
// FAQ SECTION
// ============================================

export interface FaqItem {
  question: MultiLanguageText;
  answer: MultiLanguageText;
}

export interface FaqSection extends BaseSection {
  type: 'faq';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  items: FaqItem[];
  layout: 'accordion' | 'list';
  allowMultipleOpen: boolean;
}

// ============================================
// PRICING SECTION
// ============================================

export interface PricingPlan {
  name: MultiLanguageText;
  price: string;
  period?: MultiLanguageText;
  features: MultiLanguageText[];
  ctaButton: SectionButton;
  isPopular: boolean;
}

export interface PricingSection extends BaseSection {
  type: 'pricing';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  plans: PricingPlan[];
  columns: 2 | 3 | 4;
}

// ============================================
// DATA TABLE SECTION
// ============================================

export interface DataTableColumn {
  key: string;
  header: MultiLanguageText;
  width?: string;
}

export interface DataTableRow {
  [key: string]: MultiLanguageText | string | number;
}

export interface DataTableSection extends BaseSection {
  type: 'dataTable';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  columns: DataTableColumn[];
  rows: DataTableRow[];
  showHeader: boolean;
  striped: boolean;
  bordered: boolean;
}

// ============================================
// STUDENT ENROLLMENT SECTION
// ============================================

export interface EnrollmentInfo {
  academicYear: string;
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  byDepartment?: Array<{
    department: MultiLanguageText;
    total: number;
    male: number;
    female: number;
  }>;
}

export interface StudentEnrollmentSection extends BaseSection {
  type: 'studentEnrollment';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  enrollmentData: EnrollmentInfo[];
  showChart: boolean;
  chartType: 'bar' | 'pie' | 'table';
}

// ============================================
// RECTOR SECTION
// ============================================

export interface RectorSection extends BaseSection {
  type: 'rector';
  name: MultiLanguageText;
  title: MultiLanguageText;
  photo: string;
  bio: MultiLanguageText;
  qualifications?: MultiLanguageText[];
  contactEmail?: string;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
}

// ============================================
// ORGANIZATION STRUCTURE SECTION
// ============================================

export interface OrgChartNode {
  id: string;
  title: MultiLanguageText;
  role: MultiLanguageText;
  photo?: string;
  children?: OrgChartNode[];
}

export interface OrganizationStructureSection extends BaseSection {
  type: 'organizationStructure';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  structure: OrgChartNode[];
  layout: 'tree' | 'horizontal' | 'vertical';
  showPhotos: boolean;
}

// ============================================
// SECTION UNION TYPE
// ============================================

export type Section =
  | HeroSection
  | FeatureListSection
  | ContentWithImageSection
  | CtaSection
  | TestimonialsSection
  | GallerySection
  | FaqSection
  | PricingSection
  | DataTableSection
  | StudentEnrollmentSection
  | RectorSection
  | OrganizationStructureSection;

// ============================================
// CREATE DTO (Base)
// ============================================

export interface CreateSectionBaseDto {
  name: string;
  title: MultiLanguageText;
  order?: number;
  isVisible?: boolean;
  isReusable?: boolean;
  status?: EntityStatus;
  customStyles?: Record<string, unknown>;
  customClasses?: string[];
  spacing?: SectionSpacing;
  departmentId?: string;
}

// Type-specific create DTOs would extend this base

// ============================================
// UPDATE DTO
// ============================================

export type UpdateSectionDto = Partial<Omit<Section, '_id' | 'type' | 'organizationId' | 'createdAt' | 'updatedAt'>>;

// ============================================
// QUERY PARAMETERS
// ============================================

export interface SectionQuery extends PaginationQuery {
  search?: string;
  type?: SectionType;
  status?: EntityStatus;
  isReusable?: boolean;
  isVisible?: boolean;
  departmentId?: string;
  includeDeleted?: boolean;
  language?: 'en' | 'mm';
}

// ============================================
// BULK OPERATIONS
// ============================================

export interface BulkFindSectionsDto {
  ids: string[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface SectionListResponse {
  statusCode: number;
  message: string;
  data: Section[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SectionDetailResponse {
  statusCode: number;
  message: string;
  data: Section;
}

export interface ReusableSectionsResponse {
  statusCode: number;
  message: string;
  data: Section[];
}
