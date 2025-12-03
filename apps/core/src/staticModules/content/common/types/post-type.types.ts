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

export type AttributeType =
  | 'text'
  | 'textarea'
  | 'richText'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'select'
  | 'multiSelect'
  | 'image'
  | 'file'
  | 'gallery'
  | 'url'
  | 'email'
  | 'color'
  | 'relation';

// ============================================
// ATTRIBUTE VALIDATION
// ============================================

export interface AttributeValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowedExtensions?: string[];
  maxFileSize?: number;
}

// ============================================
// ATTRIBUTE OPTION
// ============================================

export interface AttributeOption {
  label: MultiLanguageText;
  value: string;
  color?: string;
}

// ============================================
// ATTRIBUTE DEFINITION
// ============================================

export interface AttributeDefinition {
  key: string;
  label: MultiLanguageText;
  type: AttributeType;
  description?: MultiLanguageText;
  placeholder?: MultiLanguageText;
  defaultValue?: unknown;
  options?: AttributeOption[];
  validation?: AttributeValidation;
  isLocalizable: boolean;
  showInList: boolean;
  showInPreview: boolean;
  order: number;
  group?: string;
  dependsOn?: {
    attributeKey: string;
    value: unknown;
  };
  relationConfig?: {
    targetType: string;
    displayField: string;
    multiple: boolean;
  };
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
  attributes: AttributeDefinition[];
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
  attributes?: AttributeDefinition[];
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
