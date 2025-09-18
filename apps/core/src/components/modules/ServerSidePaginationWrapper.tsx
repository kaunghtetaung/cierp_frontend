"use client";

import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useModuleList } from "@repo/schema-hooks";
import { ModuleDataTable } from "@repo/schema-tables";
import { IconComponent } from "@repo/ui";
import { useLanguage } from "@repo/language";
import type { ModuleSchema } from "@repo/types";

interface ServerSidePaginationWrapperProps {
  module: ModuleSchema;
  initialData?: any[];
}

/**
 * Server-Side Pagination Wrapper
 * 
 * Handles modules that implement proper server-side pagination with metadata.
 * Expected API response: { data: [...], pagination: { total, totalPages, currentPage, limit } }
 * 
 * Features:
 * - URL-based pagination state management
 * - Server calls for each page change
 * - Proper pagination metadata handling
 * - Server-side sorting and filtering
 */
export function ServerSidePaginationWrapper({
  module,
  initialData = [],
}: ServerSidePaginationWrapperProps) {
  const { currentLanguage } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Build query parameters for server-side pagination
  const queryParams = React.useMemo(() => {
    const params: Record<string, any> = {};
    
    // Always include page and limit parameters for server-side paging
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    
    params.page = page ? parseInt(page) : 1;
    params.limit = limit ? parseInt(limit) : module.dataTableSchema.pagination?.defaultLimit || 10;
    
    // Get filter params
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('filter[') && key.endsWith(']')) {
        const fieldName = key.slice(7, -1);
        if (!params.filters) params.filters = {};
        if (!params.filters[fieldName]) params.filters[fieldName] = {};
        params.filters[fieldName]['$regex'] = value;
      }
    }
    
    // Get prefilter params - check for configured field patterns
    if (module.dataTableSchema?.prefilters?.fields) {
      module.dataTableSchema.prefilters.fields.forEach((field: any) => {
        // Use labelField if specified, otherwise default to 'name'
        const filterField = field.dataSource?.labelField || 'name';
        const paramKey = `${field.fieldName}.${filterField}`;
        let paramValue = searchParams.get(paramKey);
        
        // Fallback to .id if the preferred field doesn't exist
        let actualKey = paramKey;
        if (!paramValue) {
          const idKey = `${field.fieldName}.id`;
          paramValue = searchParams.get(idKey);
          actualKey = idKey;
        }
        
        if (paramValue) {
          if (!params.filters) params.filters = {};
          // For multiple values, send as comma-separated string
          // Backend should handle splitting if needed
          params.filters[actualKey] = paramValue;
        }
      });
    }
    
    // Get sort params (using sortBy and sortOrder to match backend API)
    const sortBy = searchParams.get('sortBy') || searchParams.get('sort');
    const sortOrder = searchParams.get('sortOrder') || searchParams.get('order');
    
    // Apply default sort if no sort is specified
    if (!sortBy && module.dataTableSchema?.sorting?.enabled && module.dataTableSchema?.sorting?.defaultSort) {
      params.sort = module.dataTableSchema.sorting.defaultSort.field;
      params.order = module.dataTableSchema.sorting.defaultSort.direction;
    } else {
      if (sortBy) params.sort = sortBy;
      if (sortOrder) params.order = sortOrder as 'asc' | 'desc';
    }
    
    return params;
  }, [searchParams, module.dataTableSchema]);

  console.log("🖥️ [SERVER-SIDE] Pagination Debug:", {
    module: module.slug,
    queryParams,
    mode: 'SERVER_SIDE_PAGINATION'
  });

  // Fetch data using React Query - always enabled for server-side pagination
  const {
    data: moduleResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useModuleList(module.slug, queryParams, {
    initialData: initialData && initialData.length > 0 ? initialData : undefined,
    staleTime: 8 * 60 * 1000, // Increased to 8 minutes for better performance
    enabled: true, // Always enabled for server-side pagination
  });

  // Debounced navigation to prevent rapid-fire API calls
  const debouncedNavigate = React.useCallback((url: string, delay: number = 300) => {
    // Clear any existing timeout
    if (debouncedNavigate.timeoutId) {
      clearTimeout(debouncedNavigate.timeoutId);
    }
    
    // Set new timeout
    debouncedNavigate.timeoutId = setTimeout(() => {
      router.push(url);
      debouncedNavigate.timeoutId = null;
    }, delay);
  }, [router]) as any;

  // Add timeout tracking to the function
  React.useEffect(() => {
    debouncedNavigate.timeoutId = null;
    
    // Cleanup on unmount
    return () => {
      if (debouncedNavigate.timeoutId) {
        clearTimeout(debouncedNavigate.timeoutId);
      }
    };
  }, []);

  // Pagination handlers for server-side pagination
  const handlePageChange = React.useCallback((page: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', page.toString());
    
    console.log(`🖥️ [SERVER-SIDE] Page change: ${page} (debounced 200ms)`);
    debouncedNavigate(`${pathname}?${newSearchParams.toString()}`, 200); // Fast debounce for pagination
  }, [searchParams, pathname, debouncedNavigate]);

  const handlePageSizeChange = React.useCallback((pageSize: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('limit', pageSize.toString());
    newSearchParams.set('page', '1'); // Reset to first page when changing page size
    
    console.log(`🖥️ [SERVER-SIDE] Page size change: ${pageSize} (debounced 300ms)`);
    debouncedNavigate(`${pathname}?${newSearchParams.toString()}`, 300); // Medium debounce for page size
  }, [searchParams, pathname, debouncedNavigate]);

  const handleSort = React.useCallback((sortField: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    const currentSortBy = searchParams.get('sortBy');
    const currentSortOrder = searchParams.get('sortOrder') || 'asc';
    
    // Toggle sort order if clicking the same column, otherwise default to 'asc'
    const newSortOrder = currentSortBy === sortField && currentSortOrder === 'asc' ? 'desc' : 'asc';
    
    newSearchParams.set('sortBy', sortField);
    newSearchParams.set('sortOrder', newSortOrder);
    newSearchParams.set('page', '1'); // Reset to first page when sorting changes
    
    console.log(`🖥️ [SERVER-SIDE] Sort change: ${sortField} ${newSortOrder} (debounced 250ms)`);
    debouncedNavigate(`${pathname}?${newSearchParams.toString()}`, 250); // Fast debounce for sorting
  }, [searchParams, pathname, debouncedNavigate]);

  // Extract data and pagination from response
  const moduleData = Array.isArray(moduleResponse?.data) 
    ? moduleResponse.data 
    : Array.isArray(initialData) 
      ? initialData 
      : [];
  const pagination = moduleResponse?.pagination;

  // Check for error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <IconComponent name="AlertCircle" className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {currentLanguage === "mm" ? "အချက်အလက် ရယူ၍ မရပါ" : "Failed to load data"}
        </h3>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "Unknown error occurred"}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <IconComponent name="RotateCcw" className="w-4 h-4 mr-2" />
          {currentLanguage === "mm" ? "ပြန်လည်ကြိုးစားမည်" : "Retry"}
        </button>
      </div>
    );
  }

  // Check for loading state
  if (isLoading && !moduleData.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <IconComponent name="Loader2" className="w-8 h-8 animate-spin mr-2" />
        <span className="text-muted-foreground">
          {currentLanguage === "mm" ? "ဖွင့်နေပါသည်..." : "Loading..."}
        </span>
      </div>
    );
  }

  // Get current page and pagination info
  const currentPage = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const currentPageSize = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : module.dataTableSchema.pagination?.defaultLimit || 10;
  const currentSortBy = searchParams.get('sortBy') || undefined;
  const currentSortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
  
  const totalItems = pagination?.total || moduleData.length;
  const totalPages = pagination?.totalPages || 1;

  console.log("🖥️ [SERVER-SIDE] Rendering:", {
    dataLength: moduleData.length,
    totalItems,
    totalPages,
    currentPage,
    currentPageSize,
    hasPaginationMetadata: !!pagination
  });

  return (
    <ModuleDataTable 
      module={module} 
      data={moduleData}
      totalItems={totalItems}
      totalPages={totalPages}
      currentPage={currentPage}
      pageSize={currentPageSize}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      onSort={handleSort}
      sortBy={currentSortBy}
      sortOrder={currentSortOrder}
      isLoading={isFetching}
      onRefresh={refetch}
    />
  );
}