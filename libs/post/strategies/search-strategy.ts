// Search Strategy - Single Responsibility: Post search operations
import type { 
  SearchStrategy, 
  PostDataStrategy 
} from '../types/post-types';
import type { PostListResult, PostListOptions } from '../types/types';

export class StandardSearchStrategy implements SearchStrategy {
  constructor(
    private postDataStrategy: PostDataStrategy
  ) {}

  async searchPosts(query: string, options: PostListOptions = {}): Promise<PostListResult> {
    return await this.postDataStrategy.getPostsList({
      ...options,
      search: query,
      status: 'Published',
      visibility: 'Public'
    });
  }
}