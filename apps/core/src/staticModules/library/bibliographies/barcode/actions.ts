"use server";

import { getModuleList } from "@repo/app-modules";

interface BibliographySearchResult {
  _id: string;
  title: string;
  author?: { id: string; name: string };
  isbn?: string;
  callNo?: string;
  accessionNumbers?: Array<{
    _id?: string;
    accessionNo: string;
    status: string;
    classNo?: string;
    accessionGroup: string;
    remark?: string;
  }>;
}

interface SearchResult {
  success: boolean;
  data?: BibliographySearchResult[];
  error?: string;
}

/**
 * Server action to search bibliographies
 * Uses the same authentication pattern as the module list page
 */
export async function searchBibliographiesAction(
  searchQuery: string
): Promise<SearchResult> {
  try {
    // Validate input
    if (!searchQuery || !searchQuery.trim()) {
      console.warn("[BARCODE_SEARCH] Empty search query provided");
      return {
        success: false,
        error: "Please enter a search term",
      };
    }

    console.log(`[BARCODE_SEARCH] Searching for: "${searchQuery}"`);

    // Use getModuleList which handles authentication automatically
    // It will use the user's session token and tenant context from headers
    const result = await getModuleList<BibliographySearchResult>(
      "bibliographies",
      {
        search: searchQuery,
        limit: 50,
      }
    );

    // Handle both array response and object with data property
    const data = Array.isArray(result) ? result : result.data;

    if (!data || !Array.isArray(data)) {
      console.error("[BARCODE_SEARCH] Invalid response format:", result);
      return {
        success: false,
        error: "Invalid response from server",
      };
    }

    console.log(`[BARCODE_SEARCH] Found ${data.length} results`);

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    // Enhanced error logging
    console.error("[BARCODE_SEARCH] Error searching bibliographies:", {
      query: searchQuery,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // User-friendly error messages
    let errorMessage = "Failed to search bibliographies";

    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        errorMessage = "Unable to connect to the server. Please try again.";
      } else if (error.message.includes("401") || error.message.includes("unauthorized")) {
        errorMessage = "Authentication failed. Please refresh the page and try again.";
      } else if (error.message.includes("403") || error.message.includes("forbidden")) {
        errorMessage = "You don't have permission to search bibliographies.";
      } else if (error.message.includes("404")) {
        errorMessage = "Bibliographies module not found.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Search request timed out. Please try again.";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
