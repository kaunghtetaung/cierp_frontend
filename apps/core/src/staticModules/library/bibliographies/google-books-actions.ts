"use server";

import { getModuleReference, createModuleItem } from "@repo/app-modules";

/**
 * Google Books API Integration for Bibliography Form
 * Fetches book data by ISBN and optionally downloads book cover images
 */

export interface GoogleBookVolumeInfo {
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
  pageCount?: number;
  categories?: string[];
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  dimensions?: {
    height?: string;
    width?: string;
    thickness?: string;
  };
  language?: string;
  previewLink?: string;
  infoLink?: string;
}

export interface GoogleBookItem {
  id: string;
  selfLink?: string;
  volumeInfo: GoogleBookVolumeInfo;
}

export interface GoogleBooksResponse {
  kind: string;
  totalItems: number;
  items?: GoogleBookItem[];
}

export interface BookSearchResult {
  success: boolean;
  data?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    year?: string;
    description?: string;
    isbn10?: string;
    isbn13?: string;
    pageCount?: number;
    categories?: string[];
    language?: string;
    thumbnailUrl?: string;
    largeThumbnailUrl?: string;
    // Dimensions for physical description
    dimensions?: {
      height?: string;
      width?: string;
      thickness?: string;
    };
  };
  error?: string;
}

/**
 * Search Google Books API by ISBN
 * @param isbn - ISBN-10 or ISBN-13
 */
export async function searchGoogleBooksAction(
  isbn: string
): Promise<BookSearchResult> {
  try {
    // Clean ISBN - remove hyphens and spaces
    const cleanIsbn = isbn.replace(/[-\s]/g, "").trim();

    if (!cleanIsbn) {
      return {
        success: false,
        error: "Please enter a valid ISBN",
      };
    }

    // Validate ISBN format (10 or 13 digits)
    if (!/^(\d{10}|\d{13})$/.test(cleanIsbn)) {
      return {
        success: false,
        error: "ISBN must be 10 or 13 digits",
      };
    }

    console.log(`[GOOGLE_BOOKS] Searching for ISBN: ${cleanIsbn}`);

    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "force-cache", // Cache response
    });

    if (!response.ok) {
      console.error(
        `[GOOGLE_BOOKS] API error: ${response.status} ${response.statusText}`
      );
      return {
        success: false,
        error: `Google Books API error: ${response.status}`,
      };
    }

    const data: GoogleBooksResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log(`[GOOGLE_BOOKS] No results found for ISBN: ${cleanIsbn}`);
      return {
        success: false,
        error: "No book found with this ISBN",
      };
    }

    const book = data.items[0];
    let volumeInfo = book.volumeInfo;

    // Fetch complete book data using selfLink for more detailed information
    // The initial search returns limited data, selfLink provides complete info including dimensions
    if (book.selfLink) {
      console.log(
        `[GOOGLE_BOOKS] Fetching complete data from selfLink: ${book.selfLink}`
      );
      try {
        const detailResponse = await fetch(book.selfLink, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (detailResponse.ok) {
          const detailData: GoogleBookItem = await detailResponse.json();
          if (detailData.volumeInfo) {
            volumeInfo = detailData.volumeInfo;
            console.log(
              `[GOOGLE_BOOKS] Got complete data with dimensions:`,
              volumeInfo.dimensions
            );
          }
        }
      } catch (detailError) {
        console.warn(
          `[GOOGLE_BOOKS] Failed to fetch complete data, using search result:`,
          detailError
        );
        // Continue with the search result data if selfLink fetch fails
      }
    }

    // Extract ISBNs
    let isbn10: string | undefined;
    let isbn13: string | undefined;

    if (volumeInfo.industryIdentifiers) {
      for (const identifier of volumeInfo.industryIdentifiers) {
        if (identifier.type === "ISBN_10") {
          isbn10 = identifier.identifier;
        } else if (identifier.type === "ISBN_13") {
          isbn13 = identifier.identifier;
        }
      }
    }

    // Extract year from publishedDate
    let year: string | undefined;
    if (volumeInfo.publishedDate) {
      const yearMatch = volumeInfo.publishedDate.match(/^\d{4}/);
      if (yearMatch) {
        year = yearMatch[0];
      }
    }

    // Get best available thumbnail URL
    let thumbnailUrl: string | undefined;
    let largeThumbnailUrl: string | undefined;

    if (volumeInfo.imageLinks) {
      // Priority: extraLarge > large > medium > small > thumbnail > smallThumbnail
      largeThumbnailUrl =
        volumeInfo.imageLinks.extraLarge ||
        volumeInfo.imageLinks.large ||
        volumeInfo.imageLinks.medium ||
        volumeInfo.imageLinks.small ||
        volumeInfo.imageLinks.thumbnail;

      thumbnailUrl =
        volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail;

      // Convert HTTP to HTTPS and increase zoom
      if (largeThumbnailUrl) {
        largeThumbnailUrl = largeThumbnailUrl.replace(/^http:/, "https:");
        // Add zoom parameter for better quality
        if (!largeThumbnailUrl.includes("zoom=")) {
          largeThumbnailUrl = largeThumbnailUrl.replace(/(&?)$/, "&zoom=2");
        }
      }
      if (thumbnailUrl) {
        thumbnailUrl = thumbnailUrl.replace(/^http:/, "https:");
      }
    }

    console.log(`[GOOGLE_BOOKS] Found book: ${volumeInfo.title}`);

    return {
      success: true,
      data: {
        title: volumeInfo.title,
        subtitle: volumeInfo.subtitle,
        authors: volumeInfo.authors,
        publisher: volumeInfo.publisher,
        publishedDate: volumeInfo.publishedDate,
        year,
        description: volumeInfo.description,
        isbn10,
        isbn13,
        pageCount: volumeInfo.pageCount,
        categories: volumeInfo.categories,
        language: volumeInfo.language,
        thumbnailUrl,
        largeThumbnailUrl,
        dimensions: volumeInfo.dimensions,
      },
    };
  } catch (error) {
    console.error("[GOOGLE_BOOKS] Error searching books:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to search Google Books",
    };
  }
}

/**
 * Download book cover image from Google Books and upload to media storage
 * Returns the uploaded file URL/key for use in the form
 */
export async function downloadAndUploadBookCoverAction(params: {
  imageUrl: string;
  isbn: string;
  tenantId: string;
  app?: string;
}): Promise<{
  success: boolean;
  data?: {
    key: string;
    url: string;
    name: string;
  };
  error?: string;
}> {
  try {
    const { imageUrl, isbn, tenantId, app = "core" } = params;

    if (!imageUrl) {
      return {
        success: false,
        error: "No image URL provided",
      };
    }

    console.log(`[GOOGLE_BOOKS] Downloading cover image for ISBN: ${isbn}`);

    // Fetch the image from Google Books
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LibrarySystem/1.0)",
      },
    });

    if (!imageResponse.ok) {
      console.error(
        `[GOOGLE_BOOKS] Failed to download image: ${imageResponse.status}`
      );
      return {
        success: false,
        error: "Failed to download book cover image",
      };
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get("content-type") || "image/jpeg";

    // Determine file extension from content type
    let extension = "jpg";
    if (contentType.includes("png")) {
      extension = "png";
    } else if (contentType.includes("webp")) {
      extension = "webp";
    } else if (contentType.includes("gif")) {
      extension = "gif";
    }

    const fileName = `book-cover-${isbn}.${extension}`;

    // Create a File object for the upload action
    const file = new File([imageBuffer], fileName, { type: contentType });

    // Import and call the upload media action
    const { uploadMediaAction } = await import("../../../actions/media");

    const uploadResult = await uploadMediaAction({
      tenantId,
      app,
      path: "public/bibliographies/covers",
      file,
    });

    console.log(
      `[GOOGLE_BOOKS] Cover image uploaded successfully: ${uploadResult.key}`
    );

    return {
      success: true,
      data: {
        key: uploadResult.key,
        url: uploadResult.url,
        name: fileName,
      },
    };
  } catch (error) {
    console.error("[GOOGLE_BOOKS] Error downloading/uploading cover:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to process book cover",
    };
  }
}

/**
 * Reference data types for library module
 * Supports various backend response formats
 */
export interface RefDataItem {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  displayName?: string;
  [key: string]: unknown;
}

export interface RefDataSearchResult {
  success: boolean;
  data?: RefDataItem;
  created?: boolean;
  error?: string;
}

/**
 * Search for a reference data item by name, optionally create if not found
 * Used for author, publisher, subjects, etc.
 *
 * Uses the same API pattern as DynamicSelect:
 * - Search: GET /{appName}/{module}/ref?search={searchTerm}
 * - Create: POST /{appName}/{module} with { name: value }
 */
export async function findOrCreateRefDataAction(params: {
  module: string; // e.g., "authors", "publishers", "subjects"
  searchName: string;
  createIfNotFound?: boolean;
}): Promise<RefDataSearchResult> {
  try {
    const { module, searchName, createIfNotFound = false } = params;

    if (!searchName || !searchName.trim()) {
      return {
        success: false,
        error: "Search name is required",
      };
    }

    const trimmedName = searchName.trim();
    console.log(`[REF_DATA] Searching for "${trimmedName}" in ${module}`);

    // Search for existing entry using getModuleReference (same as DynamicSelect)
    // This calls GET /{appName}/{module}/ref?search={searchTerm}
    const searchResult = await getModuleReference<RefDataItem>(module, {
      search: trimmedName,
    });

    // getModuleReference returns an array directly
    const items = Array.isArray(searchResult) ? searchResult : [];

    if (items && items.length > 0) {
      // Find exact match (case-insensitive)
      // Handle different response formats: { id, name } or { _id, name } or { id, fullName }
      const exactMatch = items.find((item: any) => {
        const itemName = item.name || item.fullName || item.displayName || "";
        return itemName.toLowerCase() === trimmedName.toLowerCase();
      });

      if (exactMatch) {
        const itemId = exactMatch.id || exactMatch._id;
        const itemName =
          exactMatch.name || exactMatch.fullName || exactMatch.displayName;
        console.log(`[REF_DATA] Found exact match: ${itemName} (${itemId})`);
        return {
          success: true,
          data: { id: itemId, name: itemName },
          created: false,
        };
      }

      // Return first partial match if no exact match
      const firstItem = items[0] as any;
      const itemId = firstItem.id || firstItem._id;
      const itemName =
        firstItem.name || firstItem.fullName || firstItem.displayName;
      console.log(`[REF_DATA] Found partial match: ${itemName} (${itemId})`);
      return {
        success: true,
        data: { id: itemId, name: itemName },
        created: false,
      };
    }

    // Not found - create if requested
    if (createIfNotFound) {
      console.log(`[REF_DATA] Creating new entry: ${trimmedName}`);

      // Create using createModuleItem (same as QuickEntry)
      // This calls POST /{appName}/{module} with { name: value }
      const createResult = await createModuleItem(module, {
        name: trimmedName,
      });

      if (createResult) {
        const newId = createResult.id || createResult._id;
        const newName = createResult.name || trimmedName;
        console.log(`[REF_DATA] Created new entry: ${newName} (${newId})`);
        return {
          success: true,
          data: {
            id: newId,
            name: newName,
          },
          created: true,
        };
      }
    }

    // Not found and not creating
    console.log(`[REF_DATA] No match found for: ${trimmedName}`);
    return {
      success: false,
      error: `No match found for "${trimmedName}"`,
    };
  } catch (error) {
    console.error("[REF_DATA] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to search/create reference data",
    };
  }
}

/**
 * Batch search/create multiple reference data items
 * Returns mapping of input names to found/created IDs
 */
export async function batchFindOrCreateRefDataAction(params: {
  module: string; // e.g., "authors", "publishers", "subjects"
  names: string[];
  createIfNotFound?: boolean;
}): Promise<{
  success: boolean;
  data?: Array<{ name: string; id: string; created: boolean }>;
  notFound?: string[];
  error?: string;
}> {
  try {
    const { module, names, createIfNotFound = false } = params;

    if (!names || names.length === 0) {
      return {
        success: true,
        data: [],
        notFound: [],
      };
    }

    const results: Array<{ name: string; id: string; created: boolean }> = [];
    const notFound: string[] = [];

    for (const name of names) {
      const result = await findOrCreateRefDataAction({
        module,
        searchName: name,
        createIfNotFound,
      });

      if (result.success && result.data) {
        const itemId = result.data.id || result.data._id || "";
        // Use actual name from result, fallback to input name
        const itemName =
          result.data.name ||
          result.data.fullName ||
          result.data.displayName ||
          name;
        results.push({
          name: itemName,
          id: itemId,
          created: result.created || false,
        });
      } else {
        notFound.push(name);
      }
    }

    return {
      success: true,
      data: results,
      notFound,
    };
  } catch (error) {
    console.error("[REF_DATA] Batch error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to batch process reference data",
    };
  }
}
