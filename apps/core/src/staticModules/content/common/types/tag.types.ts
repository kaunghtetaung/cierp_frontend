/**
 * Tag Module TypeScript Types
 * Flat tagging system for content
 */

import type {
  MultiLanguageText,
  BaseEntity,
  EntityStatus,
  PaginationQuery,
} from './common.types';

// ============================================
// TAG ENTITY
// ============================================

export interface Tag extends BaseEntity {
  name: MultiLanguageText;
  slug: string;
  description?: MultiLanguageText;
  color?: string;
  postCount?: number;
  status: EntityStatus;
}

// ============================================
// CREATE DTO
// ============================================

export interface CreateTagDto {
  name: MultiLanguageText;
  slug?: string;
  description?: MultiLanguageText;
  color?: string;
  status?: EntityStatus;
  departmentId?: string;
}

// ============================================
// UPDATE DTO
// ============================================

export type UpdateTagDto = Partial<CreateTagDto>;

// ============================================
// QUERY PARAMETERS
// ============================================

export interface TagQuery extends PaginationQuery {
  search?: string;
  status?: EntityStatus;
  departmentId?: string;
  includePostCount?: boolean;
  includeDeleted?: boolean;
  language?: 'en' | 'mm';
}

// ============================================
// AUTOCOMPLETE
// ============================================

export interface TagAutocompleteQuery {
  search: string;
  limit?: number;
  departmentId?: string;
}

export interface TagSuggestion {
  _id: string;
  name: MultiLanguageText;
  slug: string;
  postCount?: number;
}

// ============================================
// MERGE TAGS
// ============================================

export interface MergeTagsDto {
  sourceTagIds: string[];
  targetTagId: string;
}

// ============================================
// BULK OPERATIONS
// ============================================

export interface BulkTagOperation {
  ids: string[];
  operation: 'activate' | 'deactivate' | 'delete' | 'restore';
}

// ============================================
// POPULAR TAGS
// ============================================

export interface PopularTagsQuery {
  limit?: number;
  departmentId?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface TagListResponse {
  statusCode: number;
  message: string;
  data: Tag[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TagDetailResponse {
  statusCode: number;
  message: string;
  data: Tag;
}

export interface TagAutocompleteResponse {
  statusCode: number;
  message: string;
  data: TagSuggestion[];
}
