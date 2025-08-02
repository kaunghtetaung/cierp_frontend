// SEO Strategy - Single Responsibility: SEO metadata operations
import type { 
  SEOStrategy, 
  PostDataStrategy, 
  PostMetadata 
} from '../types/post-types';
import type { PopulatedPostData } from '../types/types';

export class StandardSEOStrategy implements SEOStrategy {
  constructor(
    private postDataStrategy: PostDataStrategy
  ) {}

  async getPostMeta(slug: string): Promise<PostMetadata> {
    const post = await this.postDataStrategy.getPostBySlug(slug, true) as PopulatedPostData;
    
    return {
      title: post.seo?.title || post.title.en,
      description: post.seo?.description || post.excerpt?.en,
      keywords: post.seo?.keywords,
      ogImage: post.seo?.ogImage || post.featuredImage,
      ogTitle: post.seo?.ogTitle,
      ogDescription: post.seo?.ogDescription,
      canonicalUrl: post.seo?.canonicalUrl,
      noIndex: post.seo?.noIndex,
      author: post.author,
      categories: post.categories ? [...post.categories] : undefined,
      tags: post.tags ? [...post.tags] : undefined,
      readingTime: post.stats?.readingTime?.minutes,
      publishedAt: post.publishedAt?.toString(),
      featuredImage: post.featuredImage,
      featuredImageAlt: post.featuredImageAlt?.en
    };
  }
}