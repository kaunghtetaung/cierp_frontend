/**
 * Common CMS TypeScript Types
 * Shared types used across all CMS modules
 */

// ============================================
// MULTI-LANGUAGE
// ============================================

export interface MultiLanguageText {
  en: string;
  mm: string;
}

// ============================================
// CONTENT FORMATS
// ============================================

export type ContentFormat = 'plain' | 'markdown' | 'html' | 'json';

export type ContentBlockType =
  | 'paragraph'
  | 'heading'
  | 'image'
  | 'code'
  | 'quote'
  | 'list'
  | 'divider'
  | 'embed'
  | 'table';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  data: Record<string, unknown>;
  order: number;
}

export interface MultiLanguageContentBlocks {
  en: ContentBlock[];
  mm: ContentBlock[];
}

// ============================================
// VISIBILITY & ACCESS CONTROL
// ============================================

export type Visibility = 'Public' | 'Private' | 'Protected' | 'Password';

export interface VisibilitySettings {
  visibility: Visibility;
  password?: string;
  allowedRoles?: string[];
  allowedUsers?: string[];
  allowedGroups?: string[];
}

// ============================================
// STATUS TYPES
// ============================================

export type ContentStatus = 'Draft' | 'Published' | 'Archived' | 'Scheduled';
export type EntityStatus = 'Active' | 'Inactive';
export type CategoryStatus = 'Active' | 'Inactive' | 'Draft';

// ============================================
// PAGINATION
// ============================================

export interface PaginationQuery {
  skip?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  statusCode: number;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export interface SingleResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// ============================================
// SOFT DELETE
// ============================================

export interface SoftDeleteFields {
  deletedAt?: string;
  deletedBy?: string;
}

// ============================================
// AUDIT FIELDS
// ============================================

export interface AuditFields {
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// VERSION CONTROL
// ============================================

export interface VersionedEntity {
  version: number;
}

// ============================================
// BASE ENTITY
// ============================================

export interface BaseEntity extends AuditFields, VersionedEntity, SoftDeleteFields {
  _id: string;
  organizationId: string;
  departmentId?: string;
}

// ============================================
// SEO
// ============================================

export interface SeoMeta {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

export interface OpenGraphMeta {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface FullSeoMeta extends SeoMeta, OpenGraphMeta {
  canonicalUrl?: string;
}

// ============================================
// LAYOUT
// ============================================

export type LayoutType = 'boxed' | 'fluid' | 'blank';
export type BackgroundType = 'color' | 'image' | 'gradient';

export interface LayoutBackground {
  type: BackgroundType;
  value?: string;
  opacity?: number;
}

export interface Layout {
  type: LayoutType;
  background?: LayoutBackground;
  className?: string;
}

// ============================================
// BUTTON / CTA
// ============================================

export type ButtonStyle = 'primary' | 'secondary' | 'outline';

export interface SectionButton {
  text: MultiLanguageText;
  url: string;
  style: ButtonStyle;
  openInNewTab: boolean;
}

// ============================================
// ERROR HANDLING
// ============================================

export interface ApiError {
  statusCode: number;
  errorCode: string;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// ============================================
// QUERY KEY FACTORIES
// ============================================

export type QueryKeyFactory<T extends string> = {
  all: readonly [T];
  lists: () => readonly [T, 'list'];
  list: (params: Record<string, unknown>) => readonly [T, 'list', Record<string, unknown>];
  details: () => readonly [T, 'detail'];
  detail: (id: string) => readonly [T, 'detail', string];
};
