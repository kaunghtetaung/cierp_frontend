// Section types for theme templates
// Based on your existing section architecture

export interface MultiLanguageText {
  en: string;
  mm: string;
  _id?: string;
}

export interface BaseSection {
  _id: string;
  name: string;
  type: string;
  title?: MultiLanguageText;
  order: number;
  isEnabled: boolean;
  customClasses?: string[];
  cssSelector?: string;
}

export interface HeroSectionData extends BaseSection {
  type: 'hero';
  backgroundImage?: string;
  backgroundVideo?: string;
  overlay?: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
  // Support both old and new schema formats
  headline?: MultiLanguageText;          // Old schema field
  subheadline?: MultiLanguageText;       // Old schema field
  buttons?: Array<{                      // Old schema field
    text: MultiLanguageText;
    url: string;
    style: 'primary' | 'secondary' | 'outline';
    openInNewTab: boolean;
  }>;
  textAlignment?: 'left' | 'center' | 'right'; // Old schema field
  height?: 'small' | 'medium' | 'large' | 'fullscreen'; // Old schema field
  content?: {                           // New schema field
    title: MultiLanguageText;
    subtitle?: MultiLanguageText;
    description?: MultiLanguageText;
    primaryButton?: {
      text: MultiLanguageText;
      url: string;
      style: 'primary' | 'secondary' | 'outline';
    };
    secondaryButton?: {
      text: MultiLanguageText;
      url: string;
      style: 'primary' | 'secondary' | 'outline';
    };
  };
  layout?: 'centered' | 'left' | 'right';  // New schema field
  textAlign?: 'center' | 'left' | 'right'; // New schema field
}

export interface ContentWithImageSectionData extends BaseSection {
  type: 'contentWithImage';
  content: {
    title: MultiLanguageText;
    description: MultiLanguageText;
    image: {
      url: string;
      alt: MultiLanguageText;
    };
    button?: {
      text: MultiLanguageText;
      url: string;
      style: 'primary' | 'secondary' | 'outline';
    };
  };
  layout: 'imageLeft' | 'imageRight';
}

export interface FeatureListSectionData extends BaseSection {
  type: 'featureList';
  // Support both old and new schema formats
  headline?: MultiLanguageText;          // Old schema field
  description?: MultiLanguageText;       // Old schema field  
  features?: Array<{                     // Old schema field
    id?: string;
    icon?: string;
    image?: string;
    title: MultiLanguageText;
    description: MultiLanguageText;
    link?: {
      url: string;
      text: MultiLanguageText;
      openInNewTab: boolean;
    };
  }>;
  content?: {                           // New schema field
    title: MultiLanguageText;
    description?: MultiLanguageText;
    features: Array<{
      id: string;
      icon?: string;
      title: MultiLanguageText;
      description: MultiLanguageText;
    }>;
  };
  layout: 'grid' | 'list' | 'carousel';  // Added carousel from old schema
  columns: 1 | 2 | 3 | 4;               // Added 1 column from old schema
  showIcons?: boolean;                   // Old schema field
  showImages?: boolean;                  // Old schema field
}

export interface CallToActionSectionData extends BaseSection {
  type: 'cta';
  // Support both old and new schema formats
  headline?: MultiLanguageText;          // Old schema field
  description?: MultiLanguageText;       // Old schema field
  buttons?: Array<{                      // Old schema field
    text: MultiLanguageText;
    url: string;
    style: 'primary' | 'secondary' | 'outline';
    openInNewTab: boolean;
  }>;
  backgroundImage?: string;              // Old schema field
  backgroundColor?: string;              // Old schema field
  textColor?: string;                    // Old schema field
  alignment?: 'left' | 'center' | 'right'; // Old schema field
  size?: 'small' | 'medium' | 'large';  // Old schema field
  content?: {                           // New schema field
    title: MultiLanguageText;
    description?: MultiLanguageText;
    primaryButton: {
      text: MultiLanguageText;
      url: string;
      style: 'primary' | 'secondary' | 'outline';
    };
    secondaryButton?: {
      text: MultiLanguageText;
      url: string;
      style: 'primary' | 'secondary' | 'outline';
    };
  };
  background?: {                        // New schema field
    type: 'color' | 'image';
    value: string;
  };
}

export interface GallerySectionData extends BaseSection {
  type: 'gallery';
  // Support both old and new schema formats
  headline?: MultiLanguageText;          // Old schema field
  description?: MultiLanguageText;       // Old schema field
  images?: Array<{                       // Old schema field
    id?: string;
    url: string;
    alt?: MultiLanguageText;
    caption?: MultiLanguageText;
  }>;
  content?: {                           // New schema field
    title: MultiLanguageText;
    description?: MultiLanguageText;
    images: Array<{
      id: string;
      url: string;
      alt: MultiLanguageText;
      caption?: MultiLanguageText;
    }>;
  };
  layout: 'grid' | 'masonry' | 'carousel';
  columns: 2 | 3 | 4;
}

export interface TestimonialsSectionData extends BaseSection {
  type: 'testimonials';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  testimonials: Array<{
    quote: MultiLanguageText;
    author: {
      name: MultiLanguageText;
      title?: MultiLanguageText;
      company?: MultiLanguageText;
      avatar?: string;
    };
    rating?: number;
  }>;
  layout: 'grid' | 'carousel' | 'single';
  showRatings: boolean;
  showAvatars: boolean;
  autoplay?: boolean;
  autoplaySpeed?: number;
}

export interface FaqSectionData extends BaseSection {
  type: 'faq';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  faqs: Array<{
    question: MultiLanguageText;
    // Either plain-text `answer` (legacy / simple Q&A) OR `answerHtml`
    // (rich HTML — used by the WP-course accordion seed, supports
    // lists / tables / images). Renderer prefers `answerHtml` when set
    // and falls back to `answer`. Schema makes either valid alone.
    answer?: MultiLanguageText;
    answerHtml?: MultiLanguageText;
    category?: string;
  }>;
  layout: 'accordion' | 'tabs' | 'grid';
  allowMultipleOpen: boolean;
  // Header-visibility toggles. Default `true` if unset so existing
  // sections keep rendering their headline + description.
  showHeadline?: boolean;
  showDescription?: boolean;
  showCategories: boolean;
  searchable: boolean;
}

export interface PricingSectionData extends BaseSection {
  type: 'pricing';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  plans: Array<{
    name: MultiLanguageText;
    description?: MultiLanguageText;
    price: {
      amount: number;
      yearlyAmount?: number;
      currency: string;
      period: string;
    };
    features: Array<MultiLanguageText | string>;
    button?: {
      text: MultiLanguageText;
      url: string;
      openInNewTab?: boolean;
    };
    popular?: boolean;
    badge?: MultiLanguageText;
  }>;
  billing: 'monthly' | 'yearly' | 'both';
  layout: 'cards' | 'table';
  showComparison: boolean;
}

export interface DataTableSectionData extends BaseSection {
  type: 'dataTable';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  table: {
    columns: Array<{
      key: string;
      label: MultiLanguageText;
      type: 'text' | 'number' | 'date' | 'currency' | 'url' | 'email';
      sortable: boolean;
      filterable: boolean;
      width?: string;
    }>;
    rows: Array<Record<string, any>>;
  };
  features: {
    search: boolean;
    sort: boolean;
    filter: boolean;
    pagination: boolean;
    export: boolean;
  };
  styling: {
    striped: boolean;
    bordered: boolean;
    hover: boolean;
    compact: boolean;
  };
  rowsPerPage: number;
}

export interface OrganizationStructureSectionData extends BaseSection {
  type: 'organizationStructure';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  structure: {
    id: string;
    name: MultiLanguageText;
    title?: MultiLanguageText;
    photo?: string;
    email?: string;
    phone?: string;
    department?: MultiLanguageText;
    description?: MultiLanguageText;
    children?: Array<any>; // Recursive structure
  };
  displayOptions: {
    showPhotos: boolean;
    showTitles: boolean;
    showEmails: boolean;
    showPhones: boolean;
    expandByDefault: boolean;
    maxDepth?: number;
  };
  layout: 'tree' | 'hierarchy' | 'orgChart';
  orientation: 'vertical' | 'horizontal';
  nodeStyle: 'card' | 'minimal' | 'detailed';
}

// ============================================
// CAROUSEL SECTION
// ============================================

export interface CarouselOverlay {
  enabled: boolean;
  color: string;
  opacity: number;
}

export interface CarouselSlideData {
  id?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  overlay?: CarouselOverlay;
  image?: string;
  title?: MultiLanguageText;
  subtitle?: MultiLanguageText;
  description?: MultiLanguageText;
  buttons?: Array<{
    text: MultiLanguageText;
    url: string;
    style: 'primary' | 'secondary' | 'outline';
    openInNewTab: boolean;
  }>;
  layout?: 'centered' | 'split-left' | 'split-right' | 'flat';
  contentStyle?: 'boxed' | 'flat';
  textAlignment?: 'left' | 'center' | 'right';
}

export interface CarouselSectionData extends BaseSection {
  type: 'carousel';
  slides: CarouselSlideData[];
  autoplay?: boolean;
  autoplaySpeed?: number;
  showDots?: boolean;
  showArrows?: boolean;
  transitionEffect?: 'fade' | 'slide' | 'zoom' | 'none';
  transitionDuration?: number;
  height?: 'small' | 'medium' | 'large' | 'fullscreen';
}

// Recent Posts — first dynamic widget. Stores only a query spec +
// display config; the renderer fetches matching posts at request
// time from the content gateway. See `recent-posts/RecentPostsSection`.
export interface RecentPostsQueryData {
  postTypeSlug?: string | null;
  categoryIds?: string[];
  tagIds?: string[];
  featuredOnly?: boolean;
  limit: number;
  sort: 'latest' | 'popular' | 'pinned';
}
export interface RecentPostsSectionData extends BaseSection {
  type: 'recentPosts';
  headline?: MultiLanguageText;
  /** Lucide icon name rendered beside the headline. */
  headlineIcon?: string;
  subheadline?: MultiLanguageText;
  viewAllLabel?: MultiLanguageText;
  viewAllUrl?: string;
  query: RecentPostsQueryData;
  layout?: 'grid' | 'list' | 'overlay' | 'mosaic' | 'duo' | 'compact';
  columns?: number;
  showImage?: boolean;
  showExcerpt?: boolean;
  showDate?: boolean;
  showAuthor?: boolean;
  showCategory?: boolean;
  /** When true, the renderer shows pagination controls and treats `query.limit` as the page size. */
  enablePaging?: boolean;
}

/**
 * Stats / counters section. Renders an array of big-number tiles
 * (icon + count + title + optional description). Mirrors the admin
 * `StatsSectionFormData`. Per-counter colour overrides drive the
 * card background / text / icon colouring; layout switches between
 * grid (rows of N cards) and row (single horizontal strip).
 */
export interface StatCounter {
  title: MultiLanguageText;
  description?: MultiLanguageText;
  icon: string;
  iconColor?: string;
  count: string;
  bgColor: string;
  textColor: string;
}

export interface StatsSectionData extends BaseSection {
  type: 'stats';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  counters: StatCounter[];
  layout?: 'grid' | 'row';
  columns?: 1 | 2 | 3 | 4;
}

/**
 * Sidebar widget — categories rendered as list / tree / badges.
 * Source content is fetched at render time from the tenant's
 * Category collection. `categoryIds` is a hand-picked filter; empty
 * = render all categories.
 */
export interface CategoryListSectionData extends BaseSection {
  type: 'categoryList';
  headline?: MultiLanguageText;
  displayMode: 'list' | 'tree' | 'badge';
  categoryIds?: string[];
  showCount?: boolean;
  limit?: number;
  viewAllUrl?: string;
  viewAllLabel?: MultiLanguageText;
}

/**
 * Sidebar widget — tags rendered as cloud / list / badges. Cloud
 * mode scales pill size by `usageCount`.
 */
export interface TagListSectionData extends BaseSection {
  type: 'tagList';
  headline?: MultiLanguageText;
  displayMode: 'cloud' | 'list' | 'badge';
  tagIds?: string[];
  showCount?: boolean;
  limit?: number;
  sort?: 'popular' | 'alphabetical';
  viewAllUrl?: string;
  viewAllLabel?: MultiLanguageText;
}

/**
 * Placeholder section that renders the surrounding post or page's
 * Tiptap body content. Templates use this in their main column so
 * authored sidebar widgets surround the actual article content.
 * Carries no fields — the public renderer reads the parent post
 * out of `PostContentContext`.
 */
export interface PostBodySectionData extends BaseSection {
  type: 'postBody';
}

/**
 * Sidebar navigation menu — references a Navigation tree by
 * `menuType` and renders the recursive items as nested links. Shares
 * the Navigation collection with the header / footer menus.
 */
export interface NavigationMenuSectionData extends BaseSection {
  type: 'navigationMenu';
  headline?: MultiLanguageText;
  /** `Navigation.menuType` to fetch (e.g. 'sidebar', 'course-sidebar'). */
  menuType: string;
  displayMode?: 'tree' | 'flat';
  showIcons?: boolean;
  expandActive?: boolean;
}

/**
 * Tabbed content — horizontal (top) or vertical (left rail) labels
 * driving a single visible panel. Same per-item shape as FAQ items:
 * label + optional plain `content` / rich `contentHtml`. Renderer
 * prefers contentHtml.
 */
export interface TabsSectionData extends BaseSection {
  type: 'tabs';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  showHeadline?: boolean;
  showDescription?: boolean;
  items: Array<{
    label: MultiLanguageText;
    content?: MultiLanguageText;
    contentHtml?: MultiLanguageText;
    icon?: string;
  }>;
  orientation: 'horizontal' | 'vertical';
  defaultIndex?: number;
}

/**
 * Student enrollment counter cards — mirrors backend
 * `StudentEnrollmentSection` (apps/core/src/content/section/schemas/
 * section-discriminated-extended.schema.ts).
 *
 * Each card shows a count + icon, useful for university dashboards
 * ("4,500 students", "150 faculty", etc.).
 */
export interface StudentEnrollmentSectionData extends BaseSection {
  type: 'studentEnrollment';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  enrollmentCards: Array<{
    title: MultiLanguageText;
    subTitle: MultiLanguageText;
    icon: string;
    count: string;
    bgColor: string;
    textColor: string;
  }>;
  layout?: 'grid' | 'row';
  columns?: 1 | 2 | 3 | 4;
}

/**
 * Rector / leader profile — single-person card. Mirrors backend
 * `RectorSection`. Used for the university leadership intro band.
 */
export interface RectorSectionData extends BaseSection {
  type: 'rector';
  headline?: MultiLanguageText;
  description?: MultiLanguageText;
  person: {
    name: MultiLanguageText;
    degrees: MultiLanguageText;
    email: string;
    photo: string;
    contentText: MultiLanguageText;
    readMoreLink?: {
      url: string;
      text: MultiLanguageText;
      openInNewTab?: boolean;
    };
  };
  layout?: 'left' | 'right' | 'center';
  showEmail?: boolean;
  showDegrees?: boolean;
  imageSize?: 'small' | 'medium' | 'large';
  imageShape?: 'circle' | 'square' | 'rounded';
}

// Union type for all section types
export type SectionData =
  | HeroSectionData
  | ContentWithImageSectionData
  | FeatureListSectionData
  | CallToActionSectionData
  | GallerySectionData
  | TestimonialsSectionData
  | FaqSectionData
  | PricingSectionData
  | DataTableSectionData
  | OrganizationStructureSectionData
  | CarouselSectionData
  | RecentPostsSectionData
  | StatsSectionData
  | CategoryListSectionData
  | TagListSectionData
  | PostBodySectionData
  | NavigationMenuSectionData
  | TabsSectionData
  | StudentEnrollmentSectionData
  | RectorSectionData;

// Section component props.
// `T` is constrained to anything with a `type` discriminator rather
// than `SectionData` proper — `AppListSectionData` lives outside the
// main union (its own component module owns the type) but is still a
// valid SectionProps target when rendered via SectionRenderer.
export interface SectionProps<T extends { type: string } = SectionData> {
  section: T;
  currentLanguage?: 'en' | 'mm';
}

// Section renderer props
export interface SectionRendererProps {
  sections: SectionData[];
  currentLanguage?: 'en' | 'mm';
  className?: string;
}