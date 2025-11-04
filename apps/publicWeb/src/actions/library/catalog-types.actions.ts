'use server';

import { getLibraryModuleReference } from "@/lib/library-module-wrapper";

export interface CatalogType {
  _id: string;
  name: string;
  label: string;
  description?: string;
}

/**
 * Get catalog types reference data for dropdown
 * Endpoint: GET /library/catalog-types/ref
 */
export async function getCatalogTypesReference(
  queryParams?: Record<string, string>
): Promise<CatalogType[]> {
  try {
    const response = await getLibraryModuleReference<CatalogType>(
      'catalog-types',
      queryParams
    );

    // Ensure we always return an array
    if (!response) {
      console.warn('getCatalogTypesReference: No response from API, returning empty array');
      return [];
    }

    if (!Array.isArray(response)) {
      console.error('getCatalogTypesReference: Response is not an array:', typeof response, response);
      return [];
    }

    return response;
  } catch (error) {
    console.error('getCatalogTypesReference: Error fetching catalog types:', error);
    // Return empty array on error instead of throwing
    return [];
  }
}
