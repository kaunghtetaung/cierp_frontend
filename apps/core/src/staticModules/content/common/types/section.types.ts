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
  | 'stats'
  | 'rector'
  | 'organizationStructure'
  | 'carousel'
  | 'recentPosts'
  | 'categoryList'
  | 'tagList'
  | 'postBody'
  | 'navigationMenu'
  | 'tabs';

// ============================================
// SPACING SETTINGS
// ============================================

export interface SectionSpacing {
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  marginTop?: string;
  marginBottom?: string;
}

// ============================================
// CONTAINER SETTINGS
// ============================================

export interface ContainerSettings {
  width: 'fullWidth' | 'contained' | 'custom';
  maxWidth?: string;
  padding?: {
    left?: string;
    right?: string;
  };
}

// ============================================
// RESPONSIVE SETTINGS
// ============================================

export interface ResponsiveSettings {
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
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
  containerSettings?: ContainerSettings;
  responsiveSettings?: ResponsiveSettings;
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

// Generic stat-counter cards. Common uses include enrolled-student
// counts, alumni totals, programmes offered, faculty counts, etc.
// Replaces the old type-specific `studentEnrollment` interface.
export interface StatsSection extends BaseSection {
  type: 'stats';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  counters: Array<{
    title: MultiLanguageText;
    description?: MultiLanguageText;
    icon: string;
    iconColor?: string;
    count: string;
    bgColor: string;
    textColor: string;
  }>;
  layout?: 'grid' | 'row';
  columns?: 1 | 2 | 3 | 4;
}

// ============================================
// RECTOR SECTION
// ============================================

// Inline manual-mode person block. Used when the section does NOT
// reference a CPMS Staff record (legacy content / honourary figures).
export interface RectorPerson {
  name: MultiLanguageText;
  degrees?: MultiLanguageText;
  email?: string;
  photo?: string;
  contentText?: MultiLanguageText;
  readMoreLink?: {
    url: string;
    text: MultiLanguageText;
    openInNewTab?: boolean;
  };
}

export interface RectorSection extends BaseSection {
  type: 'rector';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  // CPMS Staff `_id`. When present the public renderer pulls card
  // content from `staff.publicProfile`. When absent, `person` below
  // is used as a manual override.
  staffRef?: string;
  person?: RectorPerson;
  layout?: 'left' | 'right' | 'center';
  showEmail?: boolean;
  showDegrees?: boolean;
  showSocialLinks?: boolean;
  imageSize?: 'small' | 'medium' | 'large';
  imageShape?: 'circle' | 'square' | 'rounded';
}

// ============================================
// ORGANIZATION STRUCTURE SECTION
// ============================================

// Recursive node for manual-mode org charts. Mirrors the backend
// `OrganizationNode` shape (single root with nested `children`).
export interface OrganizationNode {
  id: string;
  name: MultiLanguageText;
  title?: MultiLanguageText;
  photo?: string;
  email?: string;
  phone?: string;
  department?: MultiLanguageText;
  description?: MultiLanguageText;
  children?: OrganizationNode[];
}

// ============================================
// CAROUSEL SECTION
// ============================================

export interface CarouselOverlay {
  enabled: boolean;
  color: string;
  opacity: number;
}

export interface CarouselSlide {
  id?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  overlay?: CarouselOverlay;
  image?: string;
  title?: MultiLanguageText;
  subtitle?: MultiLanguageText;
  description?: MultiLanguageText;
  buttons?: SectionButton[];
  layout?: 'centered' | 'split-left' | 'split-right' | 'flat';
  contentStyle?: 'boxed' | 'flat';
  textAlignment?: 'left' | 'center' | 'right';
}

export interface CarouselSection extends BaseSection {
  type: 'carousel';
  slides: CarouselSlide[];
  autoplay?: boolean;
  autoplaySpeed?: number;
  showDots?: boolean;
  showArrows?: boolean;
  transitionEffect?: 'fade' | 'slide' | 'zoom' | 'none';
  transitionDuration?: number;
  height?: 'small' | 'medium' | 'large' | 'fullscreen';
}

// ============================================
// ORGANIZATION STRUCTURE SECTION
// ============================================

export interface OrganizationStructureSection extends BaseSection {
  type: 'organizationStructure';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;

  // 'manual' = use the inline `structure` tree below.
  // 'cpms'   = public renderer fetches CPMS staff at request time
  //            and builds the tree from publicProfile.hierarchyLevel
  //            + primaryDepartmentId. Filter fields below scope it.
  derivedFrom?: 'manual' | 'cpms';
  departmentId?: string;
  hierarchyLevelMin?: number;
  hierarchyLevelMax?: number;
  tags?: string[];

  structure?: OrganizationNode;
  displayOptions?: {
    showPhotos?: boolean;
    showTitles?: boolean;
    showEmails?: boolean;
    showPhones?: boolean;
    expandByDefault?: boolean;
    maxDepth?: number;
  };
  layout?: 'tree' | 'hierarchy' | 'orgChart';
  orientation?: 'vertical' | 'horizontal';
  nodeStyle?: 'card' | 'minimal' | 'detailed';
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
  | StatsSection
  | RectorSection
  | OrganizationStructureSection
  | CarouselSection;

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
