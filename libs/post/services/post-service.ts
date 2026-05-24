// Refactored Post Service - SOLID principles implementation
// Single Responsibility: Coordinate post strategies and provide unified API
// Open/Closed: Extensible via strategy injection
// Dependency Inversion: Depends on abstractions (interfaces), not concretions

import { getCacheInstance } from "@repo/cache";
import { createHttpClient } from "@repo/api/client";
import { getApiEndpoint } from "@repo/utils/common/url";
import { getSafeHeaders } from "@repo/utils/server/headers-compat";
import type {
  PostDataStrategy,
  CategoryStrategy,
  TagStrategy,
  SearchStrategy,
  ValidationStrategy,
  SEOStrategy,
  CacheStrategy,
  UtilityStrategy,
  PostCache,
  PostHttpClient,
  TenantContext,
} from "../types/post-types";
export type { PostMetadata } from "../types/post-types";
import { POST_CONSTANTS } from "../types/post-types";
import type {
  BasePostData,
  PopulatedPostData,
  PostListResult,
  PostListOptions,
  PostCategory,
  PostTag,
} from "../types/types";
import type { MultiLanguageText } from "@repo/types";

// Strategy implementations
import { StandardTenantContext } from "../context/tenant-context";
import { StandardPostDataStrategy } from "../strategies/post-data-strategy";
import { StandardCategoryStrategy } from "../strategies/category-strategy";
import { StandardTagStrategy } from "../strategies/tag-strategy";
import { StandardSearchStrategy } from "../strategies/search-strategy";
import { StandardValidationStrategy } from "../strategies/validation-strategy";
import { StandardSEOStrategy } from "../strategies/seo-strategy";
import { StandardCacheStrategy } from "../strategies/cache-strategy";
import { StandardUtilityStrategy } from "../strategies/utility-strategy";

/**
 * Post Service using Strategy Pattern and Dependency Injection
 *
 * Responsibilities:
 * 1. Coordinate different post-related strategies
 * 2. Provide unified post access API
 * 3. Handle high-level business logic composition
 */
export class PostService {
  private cache: PostCache;
  private httpClient: PostHttpClient;
  private tenantContext: TenantContext;

  // Strategy instances - following Dependency Injection principle
  private postDataStrategy: PostDataStrategy;
  private categoryStrategy: CategoryStrategy;
  private tagStrategy: TagStrategy;
  private searchStrategy: SearchStrategy;
  private validationStrategy: ValidationStrategy;
  private seoStrategy: SEOStrategy;
  private cacheStrategy: CacheStrategy;
  private utilityStrategy: UtilityStrategy;

  constructor(baseURL: string) {
    // Dependency injection setup
    this.cache = getCacheInstance() as unknown as PostCache;
    this.httpClient = createHttpClient({
      baseURL,
      enableAuth: true,
      enableCSRF: false, // Post API doesn't need CSRF for public reading
      timeout: 10000, // 10 second timeout for server requests
    }) as unknown as PostHttpClient;
    this.tenantContext = new StandardTenantContext();

    // Initialize strategies with injected dependencies
    this.postDataStrategy = new StandardPostDataStrategy(
      this.cache,
      this.httpClient,
      this.tenantContext
    );
    this.categoryStrategy = new StandardCategoryStrategy(
      this.cache,
      this.httpClient,
      this.tenantContext
    );
    this.tagStrategy = new StandardTagStrategy(
      this.cache,
      this.httpClient,
      this.tenantContext
    );
    this.searchStrategy = new StandardSearchStrategy(this.postDataStrategy);
    this.validationStrategy = new StandardValidationStrategy(
      this.postDataStrategy
    );
    this.seoStrategy = new StandardSEOStrategy(this.postDataStrategy);
    this.cacheStrategy = new StandardCacheStrategy();
    this.utilityStrategy = new StandardUtilityStrategy();
  }

  // ===== POST DATA METHODS =====
  async getPostBySlug(
    slug: string,
    populate: boolean = true
  ): Promise<BasePostData | PopulatedPostData> {
    return await this.postDataStrategy.getPostBySlug(slug, populate);
  }

  async getPostsList(options: PostListOptions = {}): Promise<PostListResult> {
    return await this.postDataStrategy.getPostsList(options);
  }

  async getPublicPosts(
    options: Omit<PostListOptions, "status" | "visibility"> = {}
  ): Promise<PostListResult> {
    return await this.postDataStrategy.getPostsList({
      ...options,
      status: "Published",
      visibility: "Public",
    });
  }

  async getFeaturedPosts(
    limit: number = POST_CONSTANTS.DEFAULT_FEATURED_LIMIT
  ): Promise<BasePostData[]> {
    const result = await this.getPublicPosts({
      featured: true,
      limit,
      sortBy: "publishedAt",
      sortOrder: "desc",
    });
    return [...result.posts];
  }

  async getPostsByCategory(
    categorySlug: string,
    options: PostListOptions = {}
  ): Promise<PostListResult> {
    const category = await this.categoryStrategy.getCategoryBySlug(
      categorySlug
    );
    if (!category) {
      throw new Error(`Category not found: ${categorySlug}`);
    }

    return this.getPublicPosts({
      ...options,
      categoryIds: [category._id],
    });
  }

  async getPostsByTag(
    tagSlug: string,
    options: PostListOptions = {}
  ): Promise<PostListResult> {
    const tag = await this.tagStrategy.getTagBySlug(tagSlug);
    if (!tag) {
      throw new Error(`Tag not found: ${tagSlug}`);
    }

    return this.getPublicPosts({
      ...options,
      tagIds: [tag._id],
    });
  }

  async incrementPostViews(slug: string): Promise<void> {
    return await this.postDataStrategy.incrementPostViews(slug);
  }

  async isPostAccessible(slug: string): Promise<boolean> {
    return await this.postDataStrategy.isPostAccessible(slug);
  }

  // ===== CATEGORY METHODS =====
  async getCategoryBySlug(slug: string): Promise<PostCategory | null> {
    return await this.categoryStrategy.getCategoryBySlug(slug);
  }

  async getCategories(): Promise<PostCategory[]> {
    return await this.categoryStrategy.getCategories();
  }

  // ===== TAG METHODS =====
  async getTagBySlug(slug: string): Promise<PostTag | null> {
    return await this.tagStrategy.getTagBySlug(slug);
  }

  async getTags(): Promise<PostTag[]> {
    return await this.tagStrategy.getTags();
  }

  // ===== SEARCH METHODS =====
  async searchPosts(
    query: string,
    options: PostListOptions = {}
  ): Promise<PostListResult> {
    return await this.searchStrategy.searchPosts(query, options);
  }

  // ===== VALIDATION METHODS =====
  isValidPostData(data: any): data is BasePostData | PopulatedPostData {
    return this.validationStrategy.isValidPostData(data);
  }

  async validatePost(slug: string): Promise<boolean> {
    return await this.validationStrategy.validatePost(slug);
  }

  // ===== SEO METHODS =====
  async getPostMeta(slug: string): Promise<PostMetadata> {
    return await this.seoStrategy.getPostMeta(slug);
  }

  // ===== CACHE METHODS =====
  async clearPostCache(tenantId?: string, slug?: string): Promise<void> {
    return await this.cacheStrategy.clearPostCache(tenantId, slug);
  }

  // ===== UTILITY METHODS =====
  getLocalizedText(
    text: MultiLanguageText | string | undefined,
    language: string = "en"
  ): string {
    return this.utilityStrategy.getLocalizedText(text, language);
  }

  getPostUrl(slug: string, baseUrl: string = ""): string {
    return this.utilityStrategy.getPostUrl(slug, baseUrl);
  }

  isPostPublished(post: BasePostData): boolean {
    return this.utilityStrategy.isPostPublished(post);
  }

  generatePostExcerpt(content: string, maxLength?: number): string {
    return this.utilityStrategy.generatePostExcerpt(content, maxLength);
  }

  calculateReadingTime(
    content: string,
    language?: string
  ): { minutes: number; words: number } {
    return this.utilityStrategy.calculateReadingTime(content, language);
  }
}

// Create a singleton instance of the service
// This allows us to export cached, standalone functions for easy server-side use.
let postServiceInstance: PostService | null = null;

const getPostService = async () => {
  if (!postServiceInstance) {
    // Get dynamic API URL based on current request context
    let baseURL: string;

    try {
      const headerStore = await getSafeHeaders();
      const host = headerStore.get('host');
      const protocol = headerStore.get('x-forwarded-proto') || 'http';

      if (host) {
        const apiEndpoint = getApiEndpoint(host, protocol);
        baseURL = apiEndpoint.fullUrl;
      } else {
        // Fallback to environment variable for localhost
        baseURL = process.env.API_GATEWAY_URL;
        if (!baseURL) {
          throw new Error('API_GATEWAY_URL environment variable is required for localhost');
        }
      }
    } catch (error) {
      // If headers not available, require API_GATEWAY_URL environment variable
      baseURL = process.env.API_GATEWAY_URL;
      if (!baseURL) {
        throw new Error('API_GATEWAY_URL environment variable is required when headers are not available');
      }
    }

    postServiceInstance = new PostService(baseURL);
  }
  return postServiceInstance;
};

// Export standalone functions that use the service instance.
//
// `getPostService` is async (it pulls the per-request API base URL
// from request headers) so every standalone export here MUST `await`
// it before calling a method — calling `.foo()` on the returned
// Promise produces "X is not a function" at runtime.
//
// Async-class methods are awaited in turn so the caller sees the
// underlying value (not a Promise<Promise<T>>).
export const getPostBySlug = async (slug: string, populate: boolean = true) =>
  (await getPostService()).getPostBySlug(slug, populate);
export const getPostsList = async (options: PostListOptions = {}) =>
  (await getPostService()).getPostsList(options);
export const getPublicPosts = async (
  options: Omit<PostListOptions, "status" | "visibility"> = {}
) => (await getPostService()).getPublicPosts(options);
export const getFeaturedPosts = async (limit?: number) =>
  (await getPostService()).getFeaturedPosts(limit);
export const getPostsByCategory = async (
  categorySlug: string,
  options: PostListOptions = {}
) => (await getPostService()).getPostsByCategory(categorySlug, options);
export const getPostsByTag = async (
  tagSlug: string,
  options: PostListOptions = {}
) => (await getPostService()).getPostsByTag(tagSlug, options);
export const incrementPostViews = async (slug: string) =>
  (await getPostService()).incrementPostViews(slug);
export const isPostAccessible = async (slug: string) =>
  (await getPostService()).isPostAccessible(slug);
export const getCategoryBySlug = async (slug: string) =>
  (await getPostService()).getCategoryBySlug(slug);
export const getCategories = async () => (await getPostService()).getCategories();
export const getTagBySlug = async (slug: string) =>
  (await getPostService()).getTagBySlug(slug);
export const getTags = async () => (await getPostService()).getTags();
export const searchPosts = async (
  query: string,
  options: PostListOptions = {}
) => (await getPostService()).searchPosts(query, options);
export const isValidPostData = async (
  data: any
): Promise<boolean> =>
  (await getPostService()).isValidPostData(data);
export const validatePost = async (slug: string) =>
  (await getPostService()).validatePost(slug);
export const getPostMeta = async (slug: string) =>
  (await getPostService()).getPostMeta(slug);
export const clearPostCache = async (tenantId?: string, slug?: string) =>
  (await getPostService()).clearPostCache(tenantId, slug);
export const getLocalizedText = async (
  text: MultiLanguageText | string | undefined,
  language?: string
) => (await getPostService()).getLocalizedText(text, language);
export const getPostUrl = async (slug: string, baseUrl?: string) =>
  (await getPostService()).getPostUrl(slug, baseUrl);
export const isPostPublished = async (post: BasePostData) =>
  (await getPostService()).isPostPublished(post);
export const generatePostExcerpt = async (content: string, maxLength?: number) =>
  (await getPostService()).generatePostExcerpt(content, maxLength);
export const calculateReadingTime = async (content: string, language?: string) =>
  (await getPostService()).calculateReadingTime(content, language);
