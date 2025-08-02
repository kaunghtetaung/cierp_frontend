// Server-side content utilities
import { serverApiGet, serverApiPost } from "./api";

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  authorId: string;
}

/**
 * Fetch content by slug (server-side)
 */
export async function getContentBySlug(
  slug: string
): Promise<ContentItem | null> {
  try {
    return await serverApiGet<ContentItem>(`/content/slug/${slug}`);
  } catch (error) {
    console.error("Failed to fetch content by slug:", error);
    return null;
  }
}

/**
 * Fetch published content list (server-side)
 */
export async function getPublishedContent(
  limit: number = 10
): Promise<ContentItem[]> {
  try {
    return await serverApiGet<ContentItem[]>(
      `/content?status=published&limit=${limit}`
    );
  } catch (error) {
    console.error("Failed to fetch published content:", error);
    return [];
  }
}

/**
 * Create new content (server-side)
 */
export async function createContent(
  content: Omit<ContentItem, "id" | "createdAt" | "updatedAt">
): Promise<ContentItem | null> {
  try {
    return await serverApiPost<ContentItem>("/content", content);
  } catch (error) {
    console.error("Failed to create content:", error);
    return null;
  }
}
