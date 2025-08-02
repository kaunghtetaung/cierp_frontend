// Post service types and interfaces - SOLID refactoring
import type { ApiResponse } from "@repo/types";
import type { MultiLanguageText } from "@repo/types";
import type {
  BasePostData,
  PopulatedPostData,
  PostListResult,
  PostListOptions,
  PostCategory,
  PostTag,
  PostAuthor,
  PostSEO,
  PostStatus,
  PostVisibility
} from '../types/types';

// SEO metadata interface
export interface PostSEOMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

// Extended post metadata interface
export interface PostMetadata extends PostSEOMetadata {
  author?: PostAuthor;
  categories?: PostCategory[];
  tags?: PostTag[];
  readingTime?: number;
  publishedAt?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
}

// Cache interface for dependency injection
export interface PostCache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl: number): Promise<void>;
  del(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<number>;
}

// HTTP client interface for dependency injection
export interface PostHttpClient {
  request<T>(
    endpoint: string,
    options: {
      method: string;
      tenantId: string;
      withAuth: boolean;
    }
  ): Promise<ApiResponse<T>>;
}

// Tenant context interface
export interface TenantContext {
  getTenantId(): Promise<string>;
}

// Strategy interfaces following Single Responsibility Principle

// Post data access strategy
export interface PostDataStrategy {
  getPostBySlug(slug: string, populate: boolean): Promise<BasePostData | PopulatedPostData>;
  getPostsList(options: PostListOptions): Promise<PostListResult>;
  incrementPostViews(slug: string): Promise<void>;
  isPostAccessible(slug: string): Promise<boolean>;
}

// Category management strategy
export interface CategoryStrategy {
  getCategoryBySlug(slug: string): Promise<PostCategory | null>;
  getCategories(): Promise<PostCategory[]>;
}

// Tag management strategy  
export interface TagStrategy {
  getTagBySlug(slug: string): Promise<PostTag | null>;
  getTags(): Promise<PostTag[]>;
}

// Search strategy
export interface SearchStrategy {
  searchPosts(query: string, options: PostListOptions): Promise<PostListResult>;
}

// Validation strategy
export interface ValidationStrategy {
  isValidPostData(data: any): data is BasePostData | PopulatedPostData;
  validatePost(slug: string): Promise<boolean>;
}

// SEO metadata strategy
export interface SEOStrategy {
  getPostMeta(slug: string): Promise<PostMetadata>;
}

// Cache management strategy
export interface CacheStrategy {
  clearPostCache(tenantId?: string, slug?: string): Promise<void>;
}

// Utility functions strategy
export interface UtilityStrategy {
  getLocalizedText(text: MultiLanguageText | string | undefined, language?: string): string;
  getPostUrl(slug: string, baseUrl?: string): string;
  isPostPublished(post: BasePostData): boolean;
  generatePostExcerpt(content: string, maxLength?: number): string;
  calculateReadingTime(content: string, language?: string): { minutes: number; words: number };
}

// Constants for configuration
export const POST_CONSTANTS = {
  DEFAULT_EXCERPT_LENGTH: 160,
  WORDS_PER_MINUTE_EN: 250,
  WORDS_PER_MINUTE_MM: 200,
  DEFAULT_FEATURED_LIMIT: 5,
  LIST_CACHE_TTL: 60 * 60 * 6, // 6 hours
  CONTENT_CACHE_TTL: 60 * 60 * 24, // 24 hours
  RETRY_DELAY_MS: 1000,
  MAX_RETRIES: 2,
} as const;