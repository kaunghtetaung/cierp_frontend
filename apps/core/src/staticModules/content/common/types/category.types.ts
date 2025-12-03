/**
 * Category Module TypeScript Types
 * Hierarchical content categorization
 */

import type {
  MultiLanguageText,
  BaseEntity,
  CategoryStatus,
  PaginationQuery,
  FullSeoMeta,
} from './common.types';

// ============================================
// CATEGORY ENTITY
// ============================================

export interface Category extends BaseEntity {
  name: MultiLanguageText;
  slug: string;
  description?: MultiLanguageText;
  icon?: string;
  image?: string;
  color?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  childrenCount?: number;
  level: number;
  path: string[];
  order: number;
  isVisible: boolean;
  isDefault: boolean;
  postCount?: number;
  seo: FullSeoMeta;
  status: CategoryStatus;
}

// ============================================
// CATEGORY TREE NODE
// ============================================

export interface CategoryTreeNode extends Omit<Category, 'children'> {
  children: CategoryTreeNode[];
}

// ============================================
// CREATE DTO
// ============================================

export interface CreateCategoryDto {
  name: MultiLanguageText;
  slug?: string;
  description?: MultiLanguageText;
  icon?: string;
  image?: string;
  color?: string;
  parentId?: string;
  order?: number;
  isVisible?: boolean;
  isDefault?: boolean;
  seo?: Partial<FullSeoMeta>;
  status?: CategoryStatus;
  departmentId?: string;
}

// ============================================
// UPDATE DTO
// ============================================

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

// ============================================
// QUERY PARAMETERS
// ============================================

export interface CategoryQuery extends PaginationQuery {
  search?: string;
  parentId?: string;
  level?: number;
  status?: CategoryStatus;
  isVisible?: boolean;
  isDefault?: boolean;
  departmentId?: string;
  includeChildren?: boolean;
  includePostCount?: boolean;
  includeDeleted?: boolean;
  treeStructure?: boolean;
  language?: 'en' | 'mm';
}

// ============================================
// MOVE / REORDER
// ============================================

export interface MoveCategoryDto {
  targetParentId?: string; // null for root level
  targetOrder: number;
}

export interface ReorderCategoriesDto {
  items: Array<{
    id: string;
    order: number;
    parentId?: string;
  }>;
}

// ============================================
// BULK OPERATIONS
// ============================================

export interface BulkCategoryOperation {
  ids: string[];
  operation: 'activate' | 'deactivate' | 'delete' | 'restore';
}

// ============================================
// CATEGORY WITH BREADCRUMB
// ============================================

export interface CategoryBreadcrumb {
  _id: string;
  name: MultiLanguageText;
  slug: string;
}

export interface CategoryWithBreadcrumb extends Category {
  breadcrumbs: CategoryBreadcrumb[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface CategoryListResponse {
  statusCode: number;
  message: string;
  data: Category[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CategoryTreeResponse {
  statusCode: number;
  message: string;
  data: CategoryTreeNode[];
}

export interface CategoryDetailResponse {
  statusCode: number;
  message: string;
  data: Category;
}
