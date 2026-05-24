/**
 * Post Type Module TypeScript Types
 * Custom content types with dynamic attributes
 */

import type {
  MultiLanguageText,
  BaseEntity,
  EntityStatus,
  PaginationQuery,
} from './common.types';

// ============================================
// ATTRIBUTE TYPES
// ============================================

/**
 * Attribute types — matches the backend `customAttribute.type` enum exactly:
 * `/workspace/apps/core/src/content/post-type/schemas/post-type.schema.ts:14`.
 * Keep this list in sync with the backend or save will be rejected.
 */
export type AttributeType =
  | 'text'
  | 'textarea'
  | 'rich-text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'email'
  | 'url';

// ============================================
// ATTRIBUTE VALIDATION
// (Matches backend `customAttribute.validation` block.)
// ============================================

export interface AttributeValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

// ============================================
// ATTRIBUTE DEFINITION
// (Matches backend `customAttribute` schema. Frontend keeps this single-
// language because the backend stores `name`/`label` as plain strings.
// Per-tenant translation can be layered on the post-side if needed.)
// ============================================

export interface AttributeDefinition {
  /** Stable key used as the form field name + as `customFields[].fieldName`. */
  name: string;
  /** Human label shown next to the input. */
  label: string;
  type: AttributeType;
  required: boolean;
  defaultValue?: unknown;
  /** Allowed values when `type === 'select'`. */
  options?: string[];
  validation?: AttributeValidation;
  /** Display order in the post form. */
  order: number;
}

/**
 * Legacy alias kept for the existing Zod schema names — the runtime shape
 * is identical. Marked deprecated; new code should reference
 * `AttributeDefinition` directly.
 *
 * @deprecated use AttributeDefinition.options (string[]) instead.
 */
export interface AttributeOption {
  label: string;
  value: string;
}

// ============================================
// POST TYPE ENTITY
// ============================================

export interface PostType extends BaseEntity {
  name: MultiLanguageText;
  slug: string;
  description?: MultiLanguageText;
  icon?: string;
  color?: string;
  /** Per-PostType custom attributes (matches backend `customAttributes`). */
  customAttributes: AttributeDefinition[];
  supportsCategories: boolean;
  supportsTags: boolean;
  supportsComments: boolean;
  supportsRevisions: boolean;
  defaultCategoryId?: string;
  enableFeaturedImage: boolean;
  enableExcerpt: boolean;
  enableSeo: boolean;
  postCount?: number;
  status: EntityStatus;
  isSystem: boolean;
  menuOrder: number;
}

// ============================================
// CREATE DTO
// ============================================

export interface CreatePostTypeDto {
  name: MultiLanguageText;
  slug?: string;
  description?: MultiLanguageText;
  icon?: string;
  color?: string;
  customAttributes?: AttributeDefinition[];
  supportsCategories?: boolean;
  supportsTags?: boolean;
  supportsComments?: boolean;
  supportsRevisions?: boolean;
  defaultCategoryId?: string;
  enableFeaturedImage?: boolean;
  enableExcerpt?: boolean;
  enableSeo?: boolean;
  status?: EntityStatus;
  menuOrder?: number;
  departmentId?: string;
}

// ============================================
// UPDATE DTO
// ============================================

export type UpdatePostTypeDto = Partial<CreatePostTypeDto>;

// ============================================
// ATTRIBUTE OPERATIONS
// ============================================

export interface AddAttributeDto {
  attribute: AttributeDefinition;
}

export interface UpdateAttributeDto {
  attributeKey: string;
  attribute: Partial<AttributeDefinition>;
}

export interface RemoveAttributeDto {
  attributeKey: string;
}

export interface ReorderAttributesDto {
  attributeKeys: string[];
}

// ============================================
// QUERY PARAMETERS
// ============================================

export interface PostTypeQuery extends PaginationQuery {
  search?: string;
  status?: EntityStatus;
  departmentId?: string;
  includePostCount?: boolean;
  includeDeleted?: boolean;
  isSystem?: boolean;
  language?: 'en' | 'mm';
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PostTypeListResponse {
  statusCode: number;
  message: string;
  data: PostType[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PostTypeDetailResponse {
  statusCode: number;
  message: string;
  data: PostType;
}
