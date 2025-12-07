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

// Search field types
export type SearchField = "accessionNumber" | "isbn" | "title";

/**
 * Server action to search bibliographies by different fields
 * Supports: accessionNumber, isbn, title
 */
export async function searchBibliographiesAction(
  searchValue: string,
  searchField: SearchField = "accessionNumber"
): Promise<SearchResult> {
  try {
    // Validate input
    if (!searchValue || !searchValue.trim()) {
      const fieldLabels: Record<SearchField, string> = {
        accessionNumber: "accession number",
        isbn: "ISBN",
        title: "title",
      };
      console.warn(`[BARCODE_SEARCH] Empty ${fieldLabels[searchField]} provided`);
      return {
        success: false,
        error: `Please enter ${searchField === "isbn" ? "an" : "a"} ${fieldLabels[searchField]}`,
      };
    }

    console.log(`[BARCODE_SEARCH] Searching by ${searchField}: "${searchValue}"`);

    // Build query params based on search field
    // Using the same format as prefilter module: fieldName[$operator]=value
    const fieldMapping: Record<SearchField, string> = {
      accessionNumber: "accessionNumbers.accessionNo",
      isbn: "isbn",
      title: "title",
    };

    // Define which operator to use for each field
    // ISBN uses exact match ($eq), others use regex ($regex)
    const operatorMapping: Record<SearchField, string> = {
      accessionNumber: "$regex",
      isbn: "$eq",  // ISBN must be exact match
      title: "$regex",
    };

    const fieldName = fieldMapping[searchField] || "accessionNumbers.accessionNo";
    const operator = operatorMapping[searchField] || "$regex";

    // Build filters in the same format as prefilter module
    const filters: Record<string, any> = {
      [fieldName]: {
        [operator]: searchValue,
      },
    };

    const queryParams = {
      filters,
      limit: 50,
    };

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 [BARCODE_SEARCH] Query Parameters:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(JSON.stringify(queryParams, null, 2));
    console.log(`Search field: ${searchField}, Value: ${searchValue}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Use getModuleList which handles authentication automatically
    const result = await getModuleList<BibliographySearchResult>(
      "bibliographies",
      queryParams
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
      searchField,
      searchValue,
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
