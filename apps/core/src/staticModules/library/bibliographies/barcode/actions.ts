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
 * Server action to search bibliographies by accession number
 * Uses the same authentication pattern as the module list page
 */
export async function searchBibliographiesAction(
  accessionNo: string
): Promise<SearchResult> {
  try {
    // Validate input
    if (!accessionNo || !accessionNo.trim()) {
      console.warn("[BARCODE_SEARCH] Empty accession number provided");
      return {
        success: false,
        error: "Please enter an accession number",
      };
    }

    console.log(`[BARCODE_SEARCH] Searching for accession number: "${accessionNo}"`);

    // Build query params
    // Put the accessionNo filter inside the 'filters' object so it gets processed correctly
    const queryParams = {
      filters: {
        "accessionNumbers.accessionNo": accessionNo,
      },
      limit: 50,
    };

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 [BARCODE_SEARCH] Query Parameters:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(JSON.stringify(queryParams, null, 2));
    console.log("Expected API format: bibliographies?accessionNumbers.accessionNo=" + accessionNo);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Use getModuleList which handles authentication automatically
    // Search specifically by accessionNumbers.accessionNo
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
      accessionNo: accessionNo,
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
