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
    answer: MultiLanguageText;
    category?: string;
  }>;
  layout: 'accordion' | 'tabs' | 'grid';
  allowMultipleOpen: boolean;
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
  | OrganizationStructureSectionData;

// Section component props
export interface SectionProps<T extends SectionData = SectionData> {
  section: T;
  currentLanguage?: 'en' | 'mm';
}

// Section renderer props
export interface SectionRendererProps {
  sections: SectionData[];
  currentLanguage?: 'en' | 'mm';
  className?: string;
}