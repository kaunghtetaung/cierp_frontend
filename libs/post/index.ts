// Main entry point for post library - use explicit exports to avoid conflicts
export * from './types/types';

// Import types for internal use
import type { 
  BasePostData, 
  PostStatus, 
  PostVisibility, 
  PostAuthor 
} from './types/types';
import { 
  isPublicPost,
  generateExcerpt
} from './types/types';

// Re-export commonly used types
export type {
  BasePostData,
  PopulatedPostData,
  PostCreateData,
  PostUpdateData,
  PostListResult,
  PostListOptions,
  PostCopyOptions,
  PostValidationResult,
  PostCategory,
  CategoryCreateData,
  CategoryUpdateData,
  PostTag,
  TagCreateData,
  TagUpdateData,
  PostAuthor,
  PostStats,
  PostSEO,
  PostReadingTime,
  PostStatus,
  PostVisibility,
  BlogConfig,
  PostTemplate
} from './types/types';

// Re-export the new PostService class and utilities from service with aliases
export { PostService, getPostUrl as getPostUrlFromService, calculateReadingTime as calculateReadingTimeFromService } from './services/post-service';

export type {
  MultiLanguageText
} from '@repo/types';


// Re-export commonly used functions from post-wrapper
export {
  postWrapper,
  getPost,
  getPostList,
  getPostForRequest,
  getAccessiblePost,
  getBlogHomepageData,
  getRelatedPosts,
  getPostsArchive,
  PostWrapper
} from './components/post-wrapper';

// Re-export type guards and utilities
export {
  isPublishedPost,
  isScheduledPost,
  isPublicPost,
  isFeaturedPost,
  isPinnedPost,
  generatePostSlug,
  generateCategorySlug,
  generateTagSlug,
  getPostUrl,
  getPostEditUrl,
  getPostPreviewUrl,
  getCategoryUrl,
  getTagUrl,
  getAuthorUrl,
  calculateReadingTime,
  generateExcerpt
} from './types/types';

// Constants
export { POST_TEMPLATES } from './types/types';

// Version and configuration
export const POST_MODULE_VERSION = '1.0.0';

/**
 * Default configuration for the post module
 */
export const DEFAULT_POST_CONFIG = {
  language: 'en',
  fallbackLanguage: 'en',
  cacheEnabled: true,
  cacheTtl: 60 * 60 * 24, // 24 hours
  enablePermissionCheck: false, // Disabled for public posts
  postsPerPage: 10,
  featuredPostsCount: 5,
  enableTags: true,
  enableCategories: true,
  enableSEO: true
} as const;

/**
 * Utility to validate post data structure
 */
export function validatePostStructure(data: any): data is BasePostData {
  if (!data || typeof data !== 'object') return false;
  
  const requiredFields = [
    '_id', 'slug', 'title', 'content', 'status', 'visibility',
    'tenantId', 'authorId', 'categoryIds', 'tagIds', 'createdAt', 'updatedAt', 'version'
  ];
  
  return requiredFields.every(field => field in data) &&
         typeof data.title === 'object' &&
         'en' in data.title &&
         typeof data.title.en === 'string' &&
         typeof data.content === 'object' &&
         'en' in data.content &&
         typeof data.content.en === 'string' &&
         Array.isArray(data.categoryIds) &&
         Array.isArray(data.tagIds);
}

/**
 * Utility to get post status display name
 */
export function getPostStatusDisplayName(status: PostStatus): string {
  const displayNames: Record<PostStatus, string> = {
    'Draft': 'Draft',
    'Published': 'Published',
    'Archived': 'Archived',
    'Scheduled': 'Scheduled'
  };
  
  return displayNames[status] || status;
}

/**
 * Utility to get post visibility display name
 */
export function getPostVisibilityDisplayName(visibility: PostVisibility): string {
  const displayNames: Record<PostVisibility, string> = {
    'Public': 'Public',
    'Private': 'Private',
    'Protected': 'Protected'
  };
  
  return displayNames[visibility] || visibility;
}

/**
 * Utility to check if post has categories
 */
export function postHasCategories(post: BasePostData): boolean {
  return post.categoryIds.length > 0;
}

/**
 * Utility to check if post has tags
 */
export function postHasTags(post: BasePostData): boolean {
  return post.tagIds.length > 0;
}

/**
 * Utility to get blog statistics
 */
export function getBlogStatistics(posts: BasePostData[]) {
  const publicPosts = posts.filter(isPublicPost);
  const featuredPosts = posts.filter(post => post.isFeatured);
  const pinnedPosts = posts.filter(post => post.isPinned);
  
  const totalViews = posts.reduce((sum, post) => sum + (post.stats?.views || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + post.commentCount, 0);

  return {
    totalPosts: posts.length,
    publishedPosts: publicPosts.length,
    featuredPosts: featuredPosts.length,
    pinnedPosts: pinnedPosts.length,
    totalViews,
    totalComments,
    averageViews: posts.length > 0 ? Math.round(totalViews / posts.length) : 0,
    averageComments: posts.length > 0 ? Math.round(totalComments / posts.length) : 0
  };
}

/**
 * Utility to generate JSON-LD structured data for blog posts
 */
export function generatePostStructuredData(
  post: BasePostData,
  author?: PostAuthor,
  baseUrl: string = ''
): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${baseUrl}/post/${post.slug}`,
    url: `${baseUrl}/post/${post.slug}`,
    headline: post.title.en,
    description: post.excerpt?.en || generateExcerpt(post.content.en),
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    wordCount: post.stats?.readingTime?.words,
    ...(post.featuredImage && {
      image: {
        '@type': 'ImageObject',
        url: post.featuredImage,
        width: 1200,
        height: 630
      }
    }),
    ...(author && {
      author: {
        '@type': 'Person',
        name: author.name,
        ...(author.avatar && { image: author.avatar }),
        ...(author.bio && { description: author.bio.en })
      }
    }),
    publisher: {
      '@type': 'Organization',
      name: 'Post Publisher',
      ...(post.featuredImage && {
        logo: {
          '@type': 'ImageObject',
          url: post.featuredImage
        }
      })
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/post/${post.slug}`
    }
  };
}