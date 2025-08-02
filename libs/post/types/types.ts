// Post/Blog type definitions
import type { User, MultiLanguageText } from '@repo/types';

/**
 * Post status enum
 */
export type PostStatus = 'Draft' | 'Published' | 'Archived' | 'Scheduled';

/**
 * Post visibility enum
 */
export type PostVisibility = 'Public' | 'Private' | 'Protected';

/**
 * Post category
 */
export interface PostCategory {
  readonly _id: string;
  readonly name: MultiLanguageText;
  readonly slug: string;
  readonly description?: MultiLanguageText;
  readonly color?: string;
  readonly parentId?: string;
  readonly order: number;
  readonly tenantId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Post tag
 */
export interface PostTag {
  readonly _id: string;
  readonly name: MultiLanguageText;
  readonly slug: string;
  readonly color?: string;
  readonly tenantId: string;
  readonly usageCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Post author information
 */
export interface PostAuthor {
  readonly _id: string;
  readonly name: string;
  readonly email: string;
  readonly avatar?: string;
  readonly bio?: MultiLanguageText;
  readonly social?: {
    readonly twitter?: string;
    readonly linkedin?: string;
    readonly website?: string;
  };
}

/**
 * Post SEO metadata
 */
export interface PostSEO {
  readonly title?: string;
  readonly description?: string;
  readonly keywords?: string[];
  readonly ogTitle?: string;
  readonly ogDescription?: string;
  readonly ogImage?: string;
  readonly twitterCard?: 'summary' | 'summary_large_image';
  readonly canonicalUrl?: string;
  readonly noIndex?: boolean;
  readonly noFollow?: boolean;
}

/**
 * Post reading time
 */
export interface PostReadingTime {
  readonly minutes: number;
  readonly words: number;
  readonly text: MultiLanguageText;
}

/**
 * Post statistics
 */
export interface PostStats {
  readonly views: number;
  readonly likes: number;
  readonly shares: number;
  readonly comments: number;
  readonly readingTime: PostReadingTime;
}

/**
 * Base post data structure
 */
export interface BasePostData {
  readonly _id: string;
  readonly title: MultiLanguageText;
  readonly slug: string;
  readonly excerpt?: MultiLanguageText;
  readonly content: MultiLanguageText;
  readonly featuredImage?: string;
  readonly featuredImageAlt?: MultiLanguageText;
  readonly status: PostStatus;
  readonly visibility: PostVisibility;
  readonly tenantId: string;
  readonly authorId: string;
  readonly categoryIds: readonly string[];
  readonly tagIds: readonly string[];
  readonly publishedAt?: Date;
  readonly scheduledAt?: Date;
  readonly lastModifiedBy?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly version: number;
  
  // SEO and metadata
  readonly seo?: PostSEO;
  readonly customFields?: Record<string, unknown>;
  readonly isPinned: boolean;
  readonly isFeatured: boolean;
  readonly allowComments: boolean;
  readonly commentCount: number;
  
  // Statistics
  readonly stats?: PostStats;
}

/**
 * Post with populated references
 */
export interface PopulatedPostData extends Omit<BasePostData, 'authorId' | 'categoryIds' | 'tagIds'> {
  readonly author: PostAuthor;
  readonly categories: readonly PostCategory[];
  readonly tags: readonly PostTag[];
}

/**
 * Post creation data
 */
export type PostCreateData = Omit<
  BasePostData,
  '_id' | 'createdAt' | 'updatedAt' | 'version' | 'authorId' | 'lastModifiedBy' | 'commentCount' | 'stats'
> & {
  readonly authorId?: string; // Optional on creation, will be set from auth
};

/**
 * Post update data
 */
export type PostUpdateData = Partial<
  Omit<PostCreateData, 'tenantId' | 'slug'>
> & {
  readonly lastModifiedBy?: string; // Will be set from auth
};

/**
 * Post list result with pagination
 */
export interface PostListResult {
  readonly posts: readonly BasePostData[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore: boolean;
}

/**
 * Post search and filter options
 */
export interface PostListOptions {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: PostStatus;
  readonly visibility?: PostVisibility;
  readonly authorId?: string;
  readonly categoryIds?: string[];
  readonly tagIds?: string[];
  readonly search?: string;
  readonly sortBy?: 'title' | 'publishedAt' | 'createdAt' | 'updatedAt' | 'views' | 'likes';
  readonly sortOrder?: 'asc' | 'desc';
  readonly includeArchived?: boolean;
  readonly includeScheduled?: boolean;
  readonly featured?: boolean;
  readonly pinned?: boolean;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
}

/**
 * Post validation result
 */
export interface PostValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly warnings?: string[];
}

/**
 * Post copy/clone options
 */
export interface PostCopyOptions {
  readonly newSlug?: string;
  readonly newTitle?: MultiLanguageText;
  readonly targetTenantId?: string;
  readonly newStatus?: PostStatus;
  readonly preserveAuthor?: boolean;
  readonly copyCategories?: boolean;
  readonly copyTags?: boolean;
}

/**
 * Category creation data
 */
export type CategoryCreateData = Omit<
  PostCategory,
  '_id' | 'createdAt' | 'updatedAt'
>;

/**
 * Category update data
 */
export type CategoryUpdateData = Partial<
  Omit<CategoryCreateData, 'tenantId' | 'slug'>
>;

/**
 * Tag creation data
 */
export type TagCreateData = Omit<
  PostTag,
  '_id' | 'createdAt' | 'updatedAt' | 'usageCount'
>;

/**
 * Tag update data
 */
export type TagUpdateData = Partial<
  Omit<TagCreateData, 'tenantId' | 'slug'>
>;

/**
 * Post service interface
 */
export interface PostService {
  // Post CRUD
  createPost(postData: PostCreateData): Promise<BasePostData>;
  updatePost(id: string, postData: PostUpdateData): Promise<BasePostData>;
  deletePost(id: string): Promise<boolean>;
  getPostById(id: string, populate?: boolean): Promise<BasePostData | PopulatedPostData | null>;
  getPostBySlug(slug: string, tenantId: string, populate?: boolean): Promise<BasePostData | PopulatedPostData | null>;
  getPostsByTenant(tenantId: string, options?: PostListOptions): Promise<PostListResult>;
  getPublicPosts(tenantId: string): Promise<BasePostData[]>;
  duplicatePost(id: string, options?: PostCopyOptions): Promise<BasePostData>;
  copyPost(id: string, targetTenantId: string, options?: PostCopyOptions): Promise<BasePostData>;
  publishPost(id: string, scheduledAt?: Date): Promise<BasePostData>;
  unpublishPost(id: string): Promise<BasePostData>;
  archivePost(id: string): Promise<BasePostData>;
  
  // Category management
  createCategory(categoryData: CategoryCreateData): Promise<PostCategory>;
  updateCategory(id: string, categoryData: CategoryUpdateData): Promise<PostCategory>;
  deleteCategory(id: string): Promise<boolean>;
  getCategoryById(id: string): Promise<PostCategory | null>;
  getCategoriesByTenant(tenantId: string): Promise<PostCategory[]>;
  
  // Tag management
  createTag(tagData: TagCreateData): Promise<PostTag>;
  updateTag(id: string, tagData: TagUpdateData): Promise<PostTag>;
  deleteTag(id: string): Promise<boolean>;
  getTagById(id: string): Promise<PostTag | null>;
  getTagsByTenant(tenantId: string): Promise<PostTag[]>;
  
  // Statistics
  incrementPostViews(postId: string): Promise<void>;
  getPostStats(postId: string): Promise<PostStats>;
}

/**
 * Blog configuration
 */
export interface BlogConfig {
  readonly blogTitle: MultiLanguageText;
  readonly blogDescription: MultiLanguageText;
  readonly postsPerPage: number;
  readonly allowComments: boolean;
  readonly moderateComments: boolean;
  readonly featuredPostsCount: number;
  readonly enableTags: boolean;
  readonly enableCategories: boolean;
  readonly enableSEO: boolean;
  readonly socialSharing: {
    readonly twitter: boolean;
    readonly facebook: boolean;
    readonly linkedin: boolean;
    readonly pinterest: boolean;
  };
  readonly customFields?: Record<string, unknown>;
}

/**
 * Type guards for post types
 */
export function isPublishedPost(post: BasePostData): boolean {
  return post.status === 'Published' && 
         post.visibility !== 'Private' &&
         (!post.publishedAt || post.publishedAt <= new Date());
}

export function isScheduledPost(post: BasePostData): boolean {
  return post.status === 'Scheduled' && 
         post.scheduledAt !== undefined &&
         post.scheduledAt > new Date();
}

export function isPublicPost(post: BasePostData): boolean {
  return isPublishedPost(post) && 
         post.visibility === 'Public';
}

export function isFeaturedPost(post: BasePostData): boolean {
  return post.isFeatured && isPublishedPost(post);
}

export function isPinnedPost(post: BasePostData): boolean {
  return post.isPinned && isPublishedPost(post);
}

/**
 * Utility functions for posts
 */
export function generatePostSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100);
}

export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50);
}

export function generateTagSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 30);
}

export function getPostUrl(post: BasePostData, domain?: string): string {
  const baseUrl = domain || '';
  return `${baseUrl}/blog/${post.slug}`;
}

export function getPostEditUrl(post: BasePostData, adminDomain?: string): string {
  const baseUrl = adminDomain || '/admin';
  return `${baseUrl}/posts/${post._id}/edit`;
}

export function getPostPreviewUrl(post: BasePostData, domain?: string): string {
  const baseUrl = domain || '';
  return `${baseUrl}/blog/preview/${post.slug}`;
}

export function getCategoryUrl(category: PostCategory, domain?: string): string {
  const baseUrl = domain || '';
  return `${baseUrl}/blog/category/${category.slug}`;
}

export function getTagUrl(tag: PostTag, domain?: string): string {
  const baseUrl = domain || '';
  return `${baseUrl}/blog/tag/${tag.slug}`;
}

export function getAuthorUrl(author: PostAuthor, domain?: string): string {
  const baseUrl = domain || '';
  return `${baseUrl}/blog/author/${author._id}`;
}

/**
 * Reading time calculation
 */
export function calculateReadingTime(content: string, language: string = 'en'): PostReadingTime {
  const wordsPerMinute = language === 'mm' ? 200 : 250; // Adjust for Myanmar text
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  return {
    minutes,
    words,
    text: {
      en: `${minutes} min read`,
      mm: `${minutes} မိနစ် ဖတ်ရှုချိန်`
    }
  };
}

/**
 * Content excerpt generation
 */
export function generateExcerpt(content: string, maxLength: number = 160): string {
  // Strip HTML tags
  const plainText = content.replace(/<[^>]*>/g, '');
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * Post template definitions
 */
export interface PostTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly content: MultiLanguageText;
  readonly categoryIds?: string[];
  readonly tagIds?: string[];
  readonly seo?: Partial<PostSEO>;
  readonly customFields?: Record<string, unknown>;
}

/**
 * Pre-defined post templates
 */
export const POST_TEMPLATES: readonly PostTemplate[] = [
  {
    id: 'news-article',
    name: 'News Article',
    description: 'Standard news article template with lead paragraph and body',
    content: {
      en: '<p>Lead paragraph with the main news...</p><p>Detailed content goes here...</p>',
      mm: '<p>သတင်းအကြောင်းအရာ အဓိက အပိုင်း...</p><p>အသေးစိတ် အကြောင်းအရာများ...</p>'
    }
  },
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Official announcement template',
    content: {
      en: '<h2>Important Announcement</h2><p>We are pleased to announce...</p>',
      mm: '<h2>အရေးကြီး ကြေညာချက်</h2><p>ကျွန်ုပ်တို့ ကြေညာလိုပါသည်...</p>'
    }
  },
  {
    id: 'event-post',
    name: 'Event Post',
    description: 'Event announcement with details',
    content: {
      en: '<h2>Event Title</h2><p><strong>Date:</strong> [Event Date]</p><p><strong>Location:</strong> [Event Location]</p><p>Event description...</p>',
      mm: '<h2>အခမ်းအနား ခေါင်းစဉ်</h2><p><strong>ရက်စွဲ:</strong> [အခမ်းအနား ရက်စွဲ]</p><p><strong>နေရာ:</strong> [အခမ်းအနား နေရာ]</p><p>အခမ်းအနား အကြောင်း...</p>'
    }
  }
] as const;