// Server-side post wrapper using PostService
import {
  PostService,
  getPostBySlug,
  getPostsList,
  getPublicPosts,
  getFeaturedPosts,
  getPostsByCategory,
  getPostsByTag,
  getCategoryBySlug,
  getTagBySlug,
  getCategories,
  getTags,
  getPostMeta,
  isPostAccessible,
  searchPosts,
  validatePost,
  clearPostCache,
  incrementPostViews,
  getLocalizedText,
  getPostUrl,
  isPostPublished,
  generatePostExcerpt,
  calculateReadingTime,
} from "../services";
import type { PostMetadata } from "../types/post-types";
import type { PostSEOMetadata } from "../strategies/seo-strategy";
import type {
  BasePostData,
  PopulatedPostData,
  PostListResult,
  PostListOptions,
  PostCategory,
  PostTag,
  PostAuthor,
} from "../types/types";
import type { MultiLanguageText } from "@repo/types";
import { getApiDomain } from "@repo/utils/server";

export interface PostWrapperConfig {
  readonly gatewayPort: string;
  readonly authPort: string;
  readonly cacheEnabled: boolean;
  readonly cacheTtl: number;
  readonly enableSecrets: boolean;
}

const DEFAULT_CONFIG: PostWrapperConfig = {
  gatewayPort: process.env.PORT_GATEWAY || "3331",
  authPort: process.env.PORT_AUTH || "3332",
  cacheEnabled: true,
  cacheTtl: 60 * 60 * 24, // 24 hours
  enableSecrets: true,
};

/**
 * Server-side post wrapper class that manages posts using PostService
 * This is a facade pattern over PostService for backward compatibility
 */
export class PostWrapper {
  private config: PostWrapperConfig;
  private postService: PostService | null = null;

  constructor(config: Partial<PostWrapperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async ensureService(): Promise<PostService> {
    if (!this.postService) {
      const baseURL = await getApiDomain();
      this.postService = new PostService(baseURL);
    }
    return this.postService;
  }

  /**
   * Get post by slug using PostService
   */
  async getPostBySlug(
    slug: string,
    populate: boolean = true
  ): Promise<BasePostData | PopulatedPostData | null> {
    if (!slug || typeof slug !== "string") {
      console.error("Invalid slug format:", slug);
      return null;
    }

    try {
      const service = await this.ensureService();
      return await service.getPostBySlug(slug, populate);
    } catch (error) {
      console.error("Error getting post by slug:", error);
      return null;
    }
  }

  /**
   * Get posts list using PostService
   */
  async getPostsList(
    options: PostListOptions = {}
  ): Promise<PostListResult | null> {
    try {
      const service = await this.ensureService();
      return await service.getPostsList(options);
    } catch (error) {
      console.error("Error getting posts list:", error);
      return null;
    }
  }

  /**
   * Get public posts using PostService
   */
  async getPublicPosts(
    options: Omit<PostListOptions, "status" | "visibility"> = {}
  ): Promise<PostListResult | null> {
    try {
      const service = await this.ensureService();
      return await service.getPublicPosts(options);
    } catch (error) {
      console.error("Error getting public posts:", error);
      return null;
    }
  }

  /**
   * Get featured posts using PostService
   */
  async getFeaturedPosts(limit: number = 5): Promise<BasePostData[]> {
    try {
      const service = await this.ensureService();
      return await service.getFeaturedPosts(limit);
    } catch (error) {
      console.error("Error getting featured posts:", error);
      return [];
    }
  }

  /**
   * Get posts by category using PostService
   */
  async getPostsByCategory(
    categorySlug: string,
    options: PostListOptions = {}
  ): Promise<PostListResult | null> {
    try {
      const service = await this.ensureService();
      return await service.getPostsByCategory(categorySlug, options);
    } catch (error) {
      console.error("Error getting posts by category:", error);
      return null;
    }
  }

  /**
   * Get posts by tag using PostService
   */
  async getPostsByTag(
    tagSlug: string,
    options: PostListOptions = {}
  ): Promise<PostListResult | null> {
    try {
      const service = await this.ensureService();
      return await service.getPostsByTag(tagSlug, options);
    } catch (error) {
      console.error("Error getting posts by tag:", error);
      return null;
    }
  }

  /**
   * Get category by slug using PostService
   */
  async getCategoryBySlug(slug: string): Promise<PostCategory | null> {
    try {
      const service = await this.ensureService();
      return await service.getCategoryBySlug(slug);
    } catch (error) {
      console.error("Error getting category by slug:", error);
      return null;
    }
  }

  /**
   * Get tag by slug using PostService
   */
  async getTagBySlug(slug: string): Promise<PostTag | null> {
    try {
      const service = await this.ensureService();
      return await service.getTagBySlug(slug);
    } catch (error) {
      console.error("Error getting tag by slug:", error);
      return null;
    }
  }

  /**
   * Get all categories using PostService
   */
  async getCategories(): Promise<PostCategory[]> {
    try {
      const service = await this.ensureService();
      return await service.getCategories();
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  }

  /**
   * Get all tags using PostService
   */
  async getTags(): Promise<PostTag[]> {
    try {
      const service = await this.ensureService();
      return await service.getTags();
    } catch (error) {
      console.error("Error getting tags:", error);
      return [];
    }
  }

  /**
   * Get post meta information using PostService
   */
  async getPostMeta(slug: string): Promise<PostMetadata | null> {
    try {
      const service = await this.ensureService();
      return await service.getPostMeta(slug);
    } catch (error) {
      console.error("Error getting post meta:", error);
      return null;
    }
  }

  /**
   * Check if post is accessible using PostService
   */
  async isPostAccessible(slug: string): Promise<boolean> {
    try {
      const service = await this.ensureService();
      return await service.isPostAccessible(slug);
    } catch (error) {
      console.error("Error checking post accessibility:", error);
      return false;
    }
  }

  /**
   * Search posts using PostService
   */
  async searchPosts(
    query: string,
    options: PostListOptions = {}
  ): Promise<PostListResult | null> {
    try {
      const service = await this.ensureService();
      return await service.searchPosts(query, options);
    } catch (error) {
      console.error("Error searching posts:", error);
      return null;
    }
  }

  /**
   * Increment post views using PostService
   */
  async incrementPostViews(slug: string): Promise<void> {
    try {
      const service = await this.ensureService();
      await service.incrementPostViews(slug);
    } catch (error) {
      console.error("Error incrementing post views:", error);
      // Don't throw for view tracking failures
    }
  }

  /**
   * Clear post cache using PostService
   */
  async clearPostCache(tenantId?: string, slug?: string): Promise<void> {
    return await clearPostCache(tenantId, slug);
  }
}

/**
 * Default post wrapper instance
 */
export const postWrapper = new PostWrapper();

/**
 * Convenience functions using the cached service functions directly
 * These are the preferred methods for server-side usage as they use React.cache
 */
export const getPost = getPostBySlug;
export const getPostList = getPostsList; // Alias for backward compatibility

// Export all post functions
export {
  getPostBySlug,
  getPostsList,
  getPublicPosts,
  getFeaturedPosts,
  getPostsByCategory,
  getPostsByTag,
  getCategoryBySlug,
  getTagBySlug,
  getCategories,
  getTags,
  getPostMeta,
  isPostAccessible,
  searchPosts,
  validatePost,
  clearPostCache,
  incrementPostViews,
  getLocalizedText,
  getPostUrl,
  isPostPublished,
  generatePostExcerpt,
  calculateReadingTime,
};

/**
 * Server-side helper to get post for request context
 */
export async function getPostForRequest(
  slug: string,
  populate: boolean = true
): Promise<BasePostData | PopulatedPostData | null> {
  return await getPostBySlug(slug, populate);
}

/**
 * Server-side helper to get post with accessibility check
 */
export async function getAccessiblePost(
  slug: string,
  populate: boolean = true
): Promise<BasePostData | PopulatedPostData | null> {
  try {
    const accessible = await isPostAccessible(slug);
    if (!accessible) {
      return null;
    }
    return await getPostBySlug(slug, populate);
  } catch (error) {
    console.error("Error getting accessible post:", error);
    return null;
  }
}

/**
 * Server-side helper to get blog homepage data
 */
export async function getBlogHomepageData(postsPerPage: number = 10) {
  try {
    const [latestPosts, featuredPosts, categories, tags] = await Promise.all([
      getPublicPosts({
        page: 1,
        limit: postsPerPage,
        sortBy: "publishedAt",
        sortOrder: "desc",
      }),
      getFeaturedPosts(5),
      getCategories(),
      getTags(),
    ]);

    return {
      latestPosts: latestPosts?.posts || [],
      totalPosts: latestPosts?.total || 0,
      hasMorePosts: latestPosts?.hasMore || false,
      featuredPosts,
      categories: [...categories],
      tags: [...tags],
    };
  } catch (error) {
    console.error("Error getting blog homepage data:", error);
    return {
      latestPosts: [],
      totalPosts: 0,
      hasMorePosts: false,
      featuredPosts: [],
      categories: [],
      tags: [],
    };
  }
}

/**
 * Server-side helper to get related posts
 */
export async function getRelatedPosts(
  currentPost: BasePostData | PopulatedPostData,
  limit: number = 5
): Promise<BasePostData[]> {
  try {
    // Get category IDs from either format
    const categoryIds =
      "categoryIds" in currentPost
        ? [...currentPost.categoryIds]
        : "categories" in currentPost
        ? currentPost.categories.map((cat) => cat._id)
        : []; // If the post has categories, find posts in the same categories
    if (categoryIds.length > 0) {
      const relatedResult = await getPublicPosts({
        categoryIds,
        limit: limit + 1, // Get one extra to exclude current post
        sortBy: "publishedAt",
        sortOrder: "desc",
      });

      if (relatedResult) {
        // Filter out the current post and limit results
        const related = relatedResult.posts
          .filter((post) => post._id !== currentPost._id)
          .slice(0, limit);

        if (related.length > 0) {
          return related;
        }
      }
    }

    // Fallback: get latest posts from same tenant
    const latestResult = await getPublicPosts({
      limit: limit + 1,
      sortBy: "publishedAt",
      sortOrder: "desc",
    });

    if (latestResult) {
      return latestResult.posts
        .filter((post) => post._id !== currentPost._id)
        .slice(0, limit);
    }

    return [];
  } catch (error) {
    console.error("Error getting related posts:", error);
    return [];
  }
}

/**
 * Server-side helper to get posts archive by date
 */
export async function getPostsArchive(): Promise<
  Array<{ year: number; month: number; count: number; posts: BasePostData[] }>
> {
  try {
    // Get all public posts
    const allPostsResult = await getPublicPosts({
      limit: 1000, // Large limit to get all posts
      sortBy: "publishedAt",
      sortOrder: "desc",
    });

    if (!allPostsResult) {
      return [];
    }

    // Group posts by year and month
    const archive: { [key: string]: BasePostData[] } = {};

    allPostsResult.posts.forEach((post) => {
      if (post.publishedAt) {
        const date = new Date(post.publishedAt);
        const key = `${date.getFullYear()}-${date.getMonth()}`;

        if (!archive[key]) {
          archive[key] = [];
        }
        archive[key].push(post);
      }
    });

    // Convert to array format
    return Object.keys(archive)
      .sort((a, b) => b.localeCompare(a)) // Sort by date descending
      .map((key) => {
        const [year, month] = key.split("-").map(Number);
        const posts = archive[key];

        return {
          year,
          month,
          count: posts.length,
          posts,
        };
      });
  } catch (error) {
    console.error("Error getting posts archive:", error);
    return [];
  }
}

/**
 * Re-export types from post service and types
 */
export type { PostMetadata } from "../types/post-types";

export type {
  BasePostData,
  PopulatedPostData,
  PostListResult,
  PostListOptions,
  PostCategory,
  PostTag,
  PostAuthor,
  PostStatus,
  PostVisibility,
  PostSEO,
  PostStats,
  PostReadingTime,
} from "../types/types";

export type { MultiLanguageText } from "@repo/types";

/**
 * Re-export PostService for direct usage if needed
 */
export { PostService };
