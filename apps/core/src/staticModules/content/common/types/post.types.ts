/**
 * Post Module TypeScript Types
 * Content articles and custom post types
 */

import type {
  MultiLanguageText,
  BaseEntity,
  ContentStatus,
  ContentFormat,
  ContentBlock,
  PaginationQuery,
  FullSeoMeta,
  Visibility,
} from './common.types';
import type { Category } from './category.types';
import type { Tag } from './tag.types';
import type { PostType } from './post-type.types';

// ============================================
// POST ENTITY
// ============================================

export interface Post extends BaseEntity {
  title: MultiLanguageText;
  slug: string;
  excerpt?: MultiLanguageText;
  content: MultiLanguageText;
  contentFormat: ContentFormat;
  contentBlocks?: {
    en: ContentBlock[];
    mm: ContentBlock[];
  };
  featuredImage?: string;
  featuredImageAlt?: MultiLanguageText;
  gallery?: string[];
  postTypeId: string;
  postType?: PostType;
  categoryIds: string[];
  categories?: Category[];
  tagIds: string[];
  tags?: Tag[];
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  visibility: Visibility;
  password?: string;
  allowedRoles?: string[];
  allowedUsers?: string[];
  allowedGroups?: string[];
  allowComments: boolean;
  commentCount: number;
  isPinned: boolean;
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  scheduledAt?: string;
  publishedAt?: string;
  customAttributes?: Record<string, unknown>;
  seo: FullSeoMeta;
  status: ContentStatus;
  revisionCount?: number;
}

// ============================================
// POST REVISION
// ============================================

export interface PostRevision {
  _id: string;
  postId: string;
  title: MultiLanguageText;
  content: MultiLanguageText;
  excerpt?: MultiLanguageText;
  createdBy: string;
  createdAt: string;
  version: number;
}

// ============================================
// CREATE DTO
// ============================================

export interface CreatePostDto {
  title: MultiLanguageText;
  slug?: string;
  excerpt?: MultiLanguageText;
  content: MultiLanguageText;
  contentFormat?: ContentFormat;
  contentBlocks?: {
    en: ContentBlock[];
    mm: ContentBlock[];
  };
  featuredImage?: string;
  featuredImageAlt?: MultiLanguageText;
  gallery?: string[];
  postTypeId: string;
  categoryIds?: string[];
  tagIds?: string[];
  visibility?: Visibility;
  password?: string;
  allowedRoles?: string[];
  allowedUsers?: string[];
  allowedGroups?: string[];
  allowComments?: boolean;
  isPinned?: boolean;
  isFeatured?: boolean;
  scheduledAt?: string;
  customAttributes?: Record<string, unknown>;
  seo?: Partial<FullSeoMeta>;
  status?: ContentStatus;
  departmentId?: string;
}

// ============================================
// UPDATE DTO
// ============================================

export type UpdatePostDto = Partial<CreatePostDto>;

// ============================================
// QUERY PARAMETERS
// ============================================

export interface PostQuery extends PaginationQuery {
  search?: string;
  postTypeId?: string;
  postTypeSlug?: string;
  categoryId?: string;
  categorySlug?: string;
  tagId?: string;
  tagSlug?: string;
  authorId?: string;
  status?: ContentStatus;
  visibility?: Visibility;
  isFeatured?: boolean;
  isPinned?: boolean;
  departmentId?: string;
  publishedAfter?: string;
  publishedBefore?: string;
  includeDeleted?: boolean;
  includeDrafts?: boolean;
  language?: 'en' | 'mm';
}

// ============================================
// SEARCH / FULL-TEXT
// ============================================

export interface PostSearchQuery {
  query: string;
  postTypeId?: string;
  categoryId?: string;
  limit?: number;
  highlight?: boolean;
}

export interface PostSearchResult {
  _id: string;
  title: MultiLanguageText;
  slug: string;
  excerpt?: MultiLanguageText;
  featuredImage?: string;
  publishedAt?: string;
  score: number;
  highlights?: {
    title?: string[];
    content?: string[];
  };
}

// ============================================
// RELATED POSTS
// ============================================

export interface RelatedPostsQuery {
  postId: string;
  limit?: number;
  strategy?: 'category' | 'tag' | 'mixed';
}

// ============================================
// STATISTICS
// ============================================

export interface PostStatistics {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  postsByCategory: Array<{
    categoryId: string;
    categoryName: MultiLanguageText;
    count: number;
  }>;
  postsByPostType: Array<{
    postTypeId: string;
    postTypeName: MultiLanguageText;
    count: number;
  }>;
}

// ============================================
// BULK OPERATIONS
// ============================================

export interface BulkPostOperation {
  ids: string[];
  operation: 'publish' | 'unpublish' | 'archive' | 'delete' | 'restore';
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PostListResponse {
  statusCode: number;
  message: string;
  data: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PostDetailResponse {
  statusCode: number;
  message: string;
  data: Post;
}

export interface PostRevisionListResponse {
  statusCode: number;
  message: string;
  data: PostRevision[];
}

export interface PostSearchResponse {
  statusCode: number;
  message: string;
  data: PostSearchResult[];
  meta: {
    total: number;
    query: string;
    took: number;
  };
}

export interface PostStatisticsResponse {
  statusCode: number;
  message: string;
  data: PostStatistics;
}
