"use client";

import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useModuleList } from "@repo/schema-hooks";
import { ModuleDataTable } from "@repo/schema-tables";
import { IconComponent } from "@repo/ui";
import { useLanguage } from "@repo/language";
import type { ModuleSchema } from "@repo/types";

interface ClientSidePaginationWrapperProps {
  module: ModuleSchema;
  initialData?: any[];
}

/**
 * Client-Side Pagination Wrapper
 * 
 * Handles modules where the API returns ALL data without pagination metadata.
 * Implements memory-based pagination by caching the full dataset and slicing it client-side.
 * 
 * Expected API response: [...] (plain array) or { data: [...] } (without pagination field)
 * 
 * Features:
 * - Single API call to load all data
 * - Client-side data chunking for memory-based pagination  
 * - No additional API calls during pagination
 * - Client-side sorting and filtering
 * - Cached data management
 */
export function ClientSidePaginationWrapper({
  module,
  initialData = [],
}: ClientSidePaginationWrapperProps) {
  const { currentLanguage } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // State for client-side data management
  const [cachedFullData, setCachedFullData] = React.useState<any[] | null>(null);
  const [isDataLoaded, setIsDataLoaded] = React.useState(false);

  // Build initial query parameters (only for first API call)
  const initialQueryParams = React.useMemo(() => {
    const params: Record<string, any> = {};
    
    // Get filter params for initial load
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('filter[') && key.endsWith(']')) {
        const fieldName = key.slice(7, -1);
        if (!params.filters) params.filters = {};
        if (!params.filters[fieldName]) params.filters[fieldName] = {};
        params.filters[fieldName]['$regex'] = value;
      }
    }
    
    // Get sort params for initial load
    const sortBy = searchParams.get('sortBy') || searchParams.get('sort');
    const sortOrder = searchParams.get('sortOrder') || searchParams.get('order');
    if (sortBy) params.sort = sortBy;
    if (sortOrder) params.order = sortOrder as 'asc' | 'desc';
    
    return params;
  }, []); // Only compute once for initial load

  console.log("📱 [CLIENT-SIDE] Pagination Debug:", {
    module: module.slug,
    isDataLoaded,
    cachedDataLength: cachedFullData?.length || 0,
    mode: 'CLIENT_SIDE_PAGINATION'
  });

  // Fetch ALL data once using React Query
  const {
    data: moduleResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useModuleList(module.slug, initialQueryParams, {
    initialData: initialData && initialData.length > 0 ? initialData : undefined,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (longer for client-side)
    enabled: !isDataLoaded, // Only fetch once
  });

  // Cache the full dataset when loaded
  React.useEffect(() => {
    const apiModuleData = Array.isArray(moduleResponse?.data) 
      ? moduleResponse.data 
      : Array.isArray(initialData) 
        ? initialData 
        : [];
        
    if (apiModuleData.length > 0 && !cachedFullData) {
      setCachedFullData(apiModuleData);
      setIsDataLoaded(true);
      console.log("📱 [CLIENT-SIDE] Data cached:", apiModuleData.length, "records for", module.slug);
    }
  }, [moduleResponse, initialData, cachedFullData, module.slug]);

  // Pagination handlers for client-side pagination (URL state management only)
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

  // Client-side sorting handler
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

  // Get current pagination state from URL
  const currentPage = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const currentPageSize = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : module.dataTableSchema.pagination?.defaultLimit || 10;
  const currentSortBy = searchParams.get('sortBy') || undefined;
  const currentSortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

  // Use cached data if available, otherwise fall back to API data
  const fullModuleData = cachedFullData || (Array.isArray(moduleResponse?.data) 
    ? moduleResponse.data 
    : Array.isArray(initialData) 
      ? initialData 
      : []);

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
          onClick={() => {
            setCachedFullData(null);
            setIsDataLoaded(false);
            refetch();
          }}
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
          {currentLanguage === "mm" ? "ဖွင့်နေပါသည်..." : "Loading all data..."}
        </span>
      </div>
    );
  }

  // Apply client-side sorting if needed
  let sortedData = [...fullModuleData];
  if (currentSortBy && sortedData.length > 0) {
    sortedData.sort((a, b) => {
      let aVal = a[currentSortBy];
      let bVal = b[currentSortBy];
      
      // Handle different data types
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      let comparison = 0;
      if (aVal > bVal) comparison = 1;
      else if (aVal < bVal) comparison = -1;
      
      return currentSortOrder === 'desc' ? -comparison : comparison;
    });
  }

  // Apply client-side filtering if needed
  // TODO: Implement client-side filtering based on URL filters
  
  // Client-side pagination calculation
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / currentPageSize);
  
  // Calculate slice boundaries for current page
  const startIndex = (currentPage - 1) * currentPageSize;
  const endIndex = startIndex + currentPageSize;
  
  // Slice data to show only current page
  const moduleData = sortedData.slice(startIndex, endIndex);

  console.log("📱 [CLIENT-SIDE] Rendering:", {
    totalRecords: fullModuleData.length,
    currentPage,
    pageSize: currentPageSize,
    startIndex,
    endIndex,
    displayingRecords: moduleData.length,
    totalPages,
    sortBy: currentSortBy,
    sortOrder: currentSortOrder
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
      onSort={handleSort} // Client-side sorting
      sortBy={currentSortBy}
      sortOrder={currentSortOrder}
      isLoading={isFetching && !isDataLoaded}
      onRefresh={() => {
        setCachedFullData(null);
        setIsDataLoaded(false);
        refetch();
      }}
    />
  );
}