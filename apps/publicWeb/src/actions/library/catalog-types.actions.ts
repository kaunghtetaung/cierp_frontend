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

    return response || [];
  } catch (error) {
    console.error('[getCatalogTypesReference] Error:', error);
    return [];
  }
}
