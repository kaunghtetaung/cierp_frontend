// Utility Strategy - Single Responsibility: Utility functions
import type { UtilityStrategy } from '../types/post-types';
import { POST_CONSTANTS } from '../types/post-types';
import type { MultiLanguageText } from "@repo/types";
import type { BasePostData } from '../types/types';

export class StandardUtilityStrategy implements UtilityStrategy {
  
  getLocalizedText(
    text: MultiLanguageText | string | undefined,
    language: string = "en"
  ): string {
    if (!text) return "";
    if (typeof text === "string") return text;

    // Return the requested language or fallback to English
    return text[language as keyof MultiLanguageText] || text.en || "";
  }

  getPostUrl(slug: string, baseUrl: string = ""): string {
    return `${baseUrl}/post/${slug}`;
  }

  isPostPublished(post: BasePostData): boolean {
    return (
      post.status === "Published" &&
      post.visibility === "Public" &&
      (!post.publishedAt || new Date(post.publishedAt) <= new Date())
    );
  }

  generatePostExcerpt(content: string, maxLength: number = POST_CONSTANTS.DEFAULT_EXCERPT_LENGTH): string {
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

  calculateReadingTime(content: string, language: string = 'en'): { minutes: number; words: number } {
    const wordsPerMinute = language === 'mm' 
      ? POST_CONSTANTS.WORDS_PER_MINUTE_MM 
      : POST_CONSTANTS.WORDS_PER_MINUTE_EN;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    
    return { minutes, words };
  }
}