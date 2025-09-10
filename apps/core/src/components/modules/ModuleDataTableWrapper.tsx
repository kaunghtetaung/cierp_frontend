"use client";

import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useModuleList } from "@repo/schema-hooks";
import { ModuleDataTable } from "@repo/schema-tables";
import { IconComponent } from "@repo/ui";
import { useLanguage } from "@repo/language";
import type { ModuleSchema } from "@repo/types";

interface ModuleDataTableWrapperProps {
  module: ModuleSchema;
  initialData?: any[];
}

export function ModuleDataTableWrapper({
  module,
  initialData = [],
}: ModuleDataTableWrapperProps) {
  const { currentLanguage } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Convert search params to query parameters
  const queryParams = React.useMemo(() => {
    const params: Record<string, any> = {};
    
    // For server-side pagination, always include page and limit parameters
    const isClientSidePaging = module.dataTableSchema.pagination?.isClientSidePaging === true;
    const isServerSidePaging = !isClientSidePaging;
    
    if (isServerSidePaging) {
      // Get pagination params with defaults for server-side paging
      const page = searchParams.get('page');
      const limit = searchParams.get('limit');
      
      params.page = page ? parseInt(page) : 1;
      params.limit = limit ? parseInt(limit) : module.dataTableSchema.pagination?.defaultLimit || 10;
    } else {
      // For client-side paging, only include if specified in URL
      const page = searchParams.get('page');
      const limit = searchParams.get('limit');
      
      if (page) params.page = parseInt(page);
      if (limit) params.limit = parseInt(limit);
    }
    
    // Get filter params
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('filter[') && key.endsWith(']')) {
        // Extract field name from filter[fieldName]
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

  // Fetch data using React Query
  // staleTime: 0 means always fetch fresh data from backend
  // You can increase this value (in milliseconds) to cache data between page navigations
  // For example: staleTime: 30000 would cache for 30 seconds
  const {
    data: moduleResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useModuleList(module.slug, queryParams, {
    // Only use initialData if it has actual data (client-side pagination case)
    // For server-side pagination, initialData will be empty array
    initialData: initialData && initialData.length > 0 ? initialData : undefined,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes to improve performance
  });

  // Pagination handlers for server-side pagination - MUST be defined before any returns
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

  // Sorting handler for server-side sorting
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
  const fullModuleData = Array.isArray(moduleResponse?.data) 
    ? moduleResponse.data 
    : Array.isArray(initialData) 
      ? initialData 
      : [];
  const pagination = moduleResponse?.pagination;
  
  // Get current page and page size first - needed for chunking logic
  const currentPage = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const currentPageSize = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : module.dataTableSchema.pagination?.defaultLimit || 10;
  
  // Determine if we have server-side pagination or need client-side chunking
  const hasServerSidePagination = !!(pagination && pagination.totalPages);
  const needsClientSideChunking = !hasServerSidePagination && fullModuleData.length > currentPageSize;

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
  if (isLoading && !fullModuleData.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <IconComponent name="Loader2" className="w-8 h-8 animate-spin mr-2" />
        <span className="text-muted-foreground">
          {currentLanguage === "mm" ? "ဖွင့်နေပါသည်..." : "Loading..."}
        </span>
      </div>
    );
  }

  // Calculate pagination values and slice data if needed
  let moduleData: any[];
  let totalItems: number;
  let totalPages: number;
  
  const isClientSidePaging = module.dataTableSchema.pagination?.isClientSidePaging === true;
  const isServerSidePaging = !isClientSidePaging;

  if (needsClientSideChunking) {
    // Client-side chunking for large datasets without server-side pagination
    totalItems = fullModuleData.length;
    totalPages = Math.ceil(totalItems / currentPageSize);
    
    // Calculate slice boundaries
    const startIndex = (currentPage - 1) * currentPageSize;
    const endIndex = startIndex + currentPageSize;
    
    // Slice data to show only current page
    moduleData = fullModuleData.slice(startIndex, endIndex);
    
    console.log("Client-side chunking applied:", {
      totalRecords: fullModuleData.length,
      currentPage,
      pageSize: currentPageSize,
      startIndex,
      endIndex,
      displayingRecords: moduleData.length,
      totalPages
    });
  } else if (hasServerSidePagination) {
    // Server-side pagination - use data as-is
    moduleData = fullModuleData;
    totalItems = pagination?.total || fullModuleData.length;
    totalPages = pagination?.totalPages || 1;
  } else {
    // Regular client-side pagination or small datasets
    moduleData = fullModuleData;
    totalItems = fullModuleData.length;
    totalPages = isServerSidePaging 
      ? (pagination?.totalPages || 1)
      : Math.ceil(fullModuleData.length / currentPageSize);
  }
  
  console.log("ModuleDataTableWrapper debug:", {
    pagination,
    fullDataLength: fullModuleData.length,
    displayingRecords: moduleData.length,
    totalItems,
    totalPages,
    currentPage,
    currentPageSize,
    isServerSidePaging,
    paginationEnabled: module.dataTableSchema.pagination?.enabled,
    paginationConfig: module.dataTableSchema.pagination,
    // Enhanced debugging for pagination modes
    paginationMode: {
      hasServerSidePagination,
      needsClientSideChunking,
      mode: needsClientSideChunking ? 'CLIENT_CHUNKING' : hasServerSidePagination ? 'SERVER_SIDE' : 'CLIENT_SIDE',
      paginationKeys: pagination ? Object.keys(pagination) : 'none'
    }
  });

  // Get current sort state from URL
  const currentSortBy = searchParams.get('sortBy') || undefined;
  const currentSortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

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
      onSort={isServerSidePaging ? handleSort : undefined}
      sortBy={currentSortBy}
      sortOrder={currentSortOrder}
      isLoading={isFetching}
      onRefresh={refetch}
    />
  );
}