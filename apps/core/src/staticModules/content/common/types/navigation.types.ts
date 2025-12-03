/**
 * Navigation Module TypeScript Types
 * Menu management with hierarchical structure
 */

import type {
  MultiLanguageText,
  BaseEntity,
  EntityStatus,
  Visibility,
  PaginationQuery,
} from './common.types';

// ============================================
// NAVIGATION TYPES
// ============================================

export type NavigationType =
  | 'internal'
  | 'external'
  | 'page'
  | 'post'
  | 'category'
  | 'custom';

export type MenuType =
  | 'header'
  | 'footer'
  | 'sidebar'
  | 'mobile'
  | 'custom';

// ============================================
// NAVIGATION ENTITY
// ============================================

export interface Navigation extends BaseEntity {
  title: MultiLanguageText;
  slug: string;
  url?: string;
  type: NavigationType;
  pageId?: string;
  postId?: string;
  categoryId?: string;
  parentId?: string;
  children: string[] | Navigation[];
  order: number;
  level: number;
  icon?: string;
  cssClass?: string;
  isVisible: boolean;
  openInNewTab: boolean;
  requiresAuth: boolean;
  visibility: Visibility;
  allowedRoles: string[];
  allowedUsers: string[];
  allowedGroups: string[];
  menuType: MenuType;
  status: EntityStatus;
}

// ============================================
// MENU TREE NODE
// ============================================

export interface MenuTreeNode extends Omit<Navigation, 'children'> {
  children: MenuTreeNode[];
}

// ============================================
// CREATE DTO
// ============================================

export interface CreateNavigationDto {
  title: MultiLanguageText;
  slug?: string;
  url?: string;
  type: NavigationType;
  pageId?: string;
  postId?: string;
  categoryId?: string;
  parentId?: string;
  order?: number;
  icon?: string;
  cssClass?: string;
  isVisible?: boolean;
  openInNewTab?: boolean;
  requiresAuth?: boolean;
  visibility?: Visibility;
  allowedRoles?: string[];
  allowedUsers?: string[];
  allowedGroups?: string[];
  menuType: MenuType;
  departmentId?: string;
  status?: EntityStatus;
}

// ============================================
// UPDATE DTO
// ============================================

export type UpdateNavigationDto = Partial<CreateNavigationDto>;

// ============================================
// QUERY PARAMETERS
// ============================================

export interface NavigationQuery extends PaginationQuery {
  search?: string;
  menuType?: MenuType;
  type?: NavigationType;
  parentId?: string;
  level?: number;
  status?: EntityStatus;
  visibility?: Visibility;
  isVisible?: boolean;
  requiresAuth?: boolean;
  departmentId?: string;
  language?: 'en' | 'mm';
  includeChildren?: boolean;
  flatStructure?: boolean;
  filterByUserAccess?: boolean;
  includeDeleted?: boolean;
}

// ============================================
// REORDER
// ============================================

export interface ReorderNavigationDto {
  items: Array<{
    id: string;
    order: number;
    parentId?: string;
  }>;
}

// ============================================
// MOVE
// ============================================

export interface MoveNavigationDto {
  targetParentId?: string;
  targetOrder: number;
}

// ============================================
// FLAT LIST ITEM
// ============================================

export interface NavigationFlatItem extends Navigation {
  parentTitle?: MultiLanguageText;
  depth: number;
  hasChildren: boolean;
}

// ============================================
// BULK OPERATIONS
// ============================================

export interface BulkNavigationOperation {
  ids: string[];
  operation: 'activate' | 'deactivate' | 'delete' | 'restore' | 'show' | 'hide';
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface NavigationListResponse {
  statusCode: number;
  message: string;
  data: Navigation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface NavigationFlatListResponse {
  statusCode: number;
  message: string;
  data: NavigationFlatItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MenuTreeResponse {
  statusCode: number;
  message: string;
  data: MenuTreeNode[];
}

export interface NavigationDetailResponse {
  statusCode: number;
  message: string;
  data: Navigation;
}
