'use server';

import type { ApiResponse } from "@repo/types";
import { withServerActionErrorHandler } from "@repo/utils/server";

// Types for library news
export interface LibraryNews {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  publishedDate: string;
  author?: string;
  imageUrl?: string;
}

export interface LibraryNewsListResponse {
  data: LibraryNews[];
  total: number;
}

/**
 * Get library department news
 * Note: Using mock data for Phase 1
 * TODO: Implement with real backend endpoint when available
 */
export async function getLibraryNews(limit = 5) {
  return withServerActionErrorHandler(async () => {
    // Mock data for Phase 1
    const mockNews: LibraryNews[] = [
      {
        id: '1',
        title: 'New Digital Library Resources Available',
        excerpt: 'Access thousands of e-books and academic journals through our new digital platform.',
        publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Library Department'
      },
      {
        id: '2',
        title: 'Extended Library Hours for Exam Period',
        excerpt: 'Library will be open until 10 PM during the upcoming examination period.',
        publishedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Library Department'
      },
      {
        id: '3',
        title: 'Workshop: Research Database Training',
        excerpt: 'Join us for a comprehensive training session on using academic research databases.',
        publishedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Library Department'
      }
    ];

    return {
      success: true,
      data: {
        data: mockNews.slice(0, limit),
        total: mockNews.length
      },
      message: 'Library news fetched successfully',
      timestamp: new Date()
    } as ApiResponse<LibraryNewsListResponse>;
  }, {
    operation: 'get-library-news',
    component: 'library-news-actions',
    metadata: { limit }
  });
}
