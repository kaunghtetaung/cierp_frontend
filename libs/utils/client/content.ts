// Client-side content utilities
"use client";

import { apiGet, apiPost, apiPut } from "./api";

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
 * Fetch content by slug (client-side)
 */
export async function getContentBySlug(
  slug: string
): Promise<ContentItem | null> {
  try {
    return await apiGet<ContentItem>(`/content/slug/${slug}`);
  } catch (error) {
    console.error("Failed to fetch content by slug:", error);
    return null;
  }
}

/**
 * Fetch user's draft content (client-side)
 */
export async function getUserDrafts(): Promise<ContentItem[]> {
  try {
    return await apiGet<ContentItem[]>("/content/drafts");
  } catch (error) {
    console.error("Failed to fetch user drafts:", error);
    return [];
  }
}

/**
 * Update content (client-side)
 */
export async function updateContent(
  id: string,
  updates: Partial<ContentItem>
): Promise<ContentItem | null> {
  try {
    return await apiPut<ContentItem>(`/content/${id}`, updates);
  } catch (error) {
    console.error("Failed to update content:", error);
    return null;
  }
}

/**
 * Create new content (client-side)
 */
export async function createContent(
  content: Omit<ContentItem, "id" | "createdAt" | "updatedAt">
): Promise<ContentItem | null> {
  try {
    return await apiPost<ContentItem>("/content", content);
  } catch (error) {
    console.error("Failed to create content:", error);
    return null;
  }
}
