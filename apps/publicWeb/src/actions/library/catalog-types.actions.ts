'use server';

import { getLibraryModuleReference } from "@/lib/library-module-wrapper";
import { withServerActionErrorHandler } from "@repo/utils/server";

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
) {
  return withServerActionErrorHandler(async () => {
    const response = await getLibraryModuleReference<CatalogType>(
      'catalog-types',
      queryParams
    );

    return response || [];
  }, {
    operation: 'get-catalog-types-reference',
    component: 'library-catalog-types-actions'
  });
}
