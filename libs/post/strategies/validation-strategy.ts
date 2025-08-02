// Validation Strategy - Single Responsibility: Post validation operations
import type { 
  ValidationStrategy, 
  PostDataStrategy 
} from '../types/post-types';
import type { BasePostData, PopulatedPostData } from '../types/types';

export class StandardValidationStrategy implements ValidationStrategy {
  constructor(
    private postDataStrategy: PostDataStrategy
  ) {}

  isValidPostData(data: any): data is BasePostData | PopulatedPostData {
    return (
      data &&
      typeof data === "object" &&
      data._id &&
      data.slug &&
      data.title &&
      typeof data.title === "object" &&
      data.title.en &&
      data.content &&
      typeof data.content === "object" &&
      data.content.en &&
      data.status &&
      data.visibility &&
      data.tenantId
    );
  }

  async validatePost(slug: string): Promise<boolean> {
    try {
      const post = await this.postDataStrategy.getPostBySlug(slug, false);
      return !!(post && post._id && post.slug);
    } catch (error) {
      console.error(`Failed to validate post ${slug}:`, error);
      return false;
    }
  }
}