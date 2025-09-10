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
    
    // Get sort params (using sortBy and sortOrder to match backend API)
    const sortBy = searchParams.get('sortBy') || searchParams.get('sort');
    const sortOrder = searchParams.get('sortOrder') || searchParams.get('order');
    if (sortBy) params.sort = sortBy;
    if (sortOrder) params.order = sortOrder as 'asc' | 'desc';
    
    return params;
  }, [searchParams, module.dataTableSchema.pagination]);

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
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    enabled: true, // Always enabled for server-side pagination
  });

  // Pagination handlers for server-side pagination
  const handlePageChange = React.useCallback((page: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', page.toString());
    router.push(`${pathname}?${newSearchParams.toString()}`);
  }, [searchParams, pathname, router]);

  const handlePageSizeChange = React.useCallback((pageSize: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('limit', pageSize.toString());
    newSearchParams.set('page', '1'); // Reset to first page when changing page size
    router.push(`${pathname}?${newSearchParams.toString()}`);
  }, [searchParams, pathname, router]);

  const handleSort = React.useCallback((sortField: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    const currentSortBy = searchParams.get('sortBy');
    const currentSortOrder = searchParams.get('sortOrder') || 'asc';
    
    // Toggle sort order if clicking the same column, otherwise default to 'asc'
    const newSortOrder = currentSortBy === sortField && currentSortOrder === 'asc' ? 'desc' : 'asc';
    
    newSearchParams.set('sortBy', sortField);
    newSearchParams.set('sortOrder', newSortOrder);
    newSearchParams.set('page', '1'); // Reset to first page when sorting changes
    
    router.push(`${pathname}?${newSearchParams.toString()}`);
  }, [searchParams, pathname, router]);

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