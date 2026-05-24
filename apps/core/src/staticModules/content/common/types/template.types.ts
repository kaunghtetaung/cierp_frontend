/**
 * Template Module TypeScript Types
 *
 * Aligned with backend `apps/core/src/content/template/schemas/template.schema.ts`.
 * Templates are authorable, reusable layout trees (the same shape as
 * `Post.layout`) that Pages can reference instead of carrying their own.
 */

import type {
  MultiLanguageText,
  BaseEntity,
  EntityStatus,
  PaginationQuery,
} from './common.types';

// ============================================
// LAYOUT TREE — same shape as Post.layout
// ============================================

export interface TemplateLayoutColumnRef {
  sectionId?: string | null;
  sectionData?: Record<string, unknown> | null;
  order: number;
  isVisible?: boolean;
}
export interface TemplateLayoutColumn {
  id: string;
  /** 12-col grid width (1-12). */
  width: number;
  /** Mutually-exclusive with `rows` (leaf cell). */
  sectionRefs?: TemplateLayoutColumnRef[];
  /** Mutually-exclusive with `sectionRefs` (branch with sub-rows). */
  rows?: TemplateLayoutRow[];
}
export interface TemplateLayoutRow {
  id: string;
  settings?: {
    mobileStack?: boolean;
    gap?: string;
  } & Record<string, unknown>;
  columns: TemplateLayoutColumn[];
}
export interface TemplateLayoutContainer {
  id: string;
  settings?: {
    maxWidth?: 'screen-sm' | 'screen-md' | 'screen-lg' | 'screen-xl' | 'full';
    padding?: string;
    background?: string;
  } & Record<string, unknown>;
  rows: TemplateLayoutRow[];
}
export interface TemplateLayout {
  containers: TemplateLayoutContainer[];
}

// ============================================
// ENTITY
// ============================================

export interface Template extends BaseEntity {
  name: string;
  slug?: string;
  title?: MultiLanguageText;
  description?: MultiLanguageText;
  /** Optional thumbnail URL shown in the picker. */
  previewImage?: string;
  /** Free-form grouping tag ('home', 'about', 'faculty', …). */
  category?: string;
  /** The reusable layout tree authored via PageLayoutBuilder. */
  layout?: TemplateLayout;
  status: EntityStatus;
}

// ============================================
// DTOs
// ============================================

export interface CreateTemplateDto {
  name: string;
  slug?: string;
  title?: MultiLanguageText;
  description?: MultiLanguageText;
  previewImage?: string;
  category?: string;
  layout?: TemplateLayout;
  status?: EntityStatus;
  departmentId?: string;
}

export type UpdateTemplateDto = Partial<CreateTemplateDto> & {
  /** Optimistic concurrency token — backend rejects mismatches with 409. */
  version?: number;
};

// ============================================
// QUERY
// ============================================

export interface TemplateQuery extends PaginationQuery {
  /** 1-indexed page number (backend uses `page` not `skip`). */
  page?: number;
  search?: string;
  status?: EntityStatus;
  category?: string;
  departmentId?: string;
}

// ============================================
// API RESPONSES
// ============================================

export interface TemplateListResponse {
  data: Template[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TemplateRefItem {
  id: string;
  label: string;
  value: string;
  slug?: string;
  category?: string;
  previewImage?: string;
}
