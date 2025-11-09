"use client";

import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useModuleList } from "@repo/schema-hooks";
import { ModuleDataTable } from "@repo/schema-tables";
import { IconComponent } from "@repo/ui";
import { useLanguage } from "@repo/language";
import type { ModuleSchema } from "@repo/types";
import type { ModulePermissions } from "@/types/layout";
import { ModuleErrorDisplay } from "./ModuleErrorDisplay";

interface ClientSidePaginationWrapperProps {
  module: ModuleSchema;
  initialData?: any[];
  userPermissions?: ModulePermissions;
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
  userPermissions,
}: ClientSidePaginationWrapperProps) {
  const { currentLanguage } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // State for client-side data management
  const [cachedFullData, setCachedFullData] = React.useState<any[] | null>(null);
  const [isDataLoaded, setIsDataLoaded] = React.useState(false);

  // Check for refresh trigger from form save redirect
  const refreshTrigger = searchParams.get('_refresh');

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
    
    // Get prefilter params - handle text fields with operators
    if (module.dataTableSchema?.prefilters?.fields) {
      module.dataTableSchema.prefilters.fields.forEach((field: any) => {
        if (field.type === 'text') {
          // Check for operator-based params for text fields
          const operators = field.searchOptions?.operators || [{ value: '$regex' }, { value: '$eq' }];
          for (const op of operators) {
            const paramValue = searchParams.get(`${field.fieldName}[${op.value}]`);
            if (paramValue) {
              if (!params.filters) params.filters = {};
              // Send with operator structure for backend
              if (!params.filters[field.fieldName]) params.filters[field.fieldName] = {};
              params.filters[field.fieldName][op.value] = paramValue;
              break;
            }
          }
        } else if (field.type === 'yearRange') {
          // Check for year range params
          const exactValue = searchParams.get(field.fieldName) || searchParams.get(`${field.fieldName}[$eq]`);
          if (exactValue) {
            if (!params.filters) params.filters = {};
            params.filters[field.fieldName] = exactValue;
          } else {
            // Check for range operators
            const rangeOps = ['$gte', '$lte', '$gt', '$lt'];
            let hasRange = false;
            rangeOps.forEach(op => {
              const paramValue = searchParams.get(`${field.fieldName}[${op}]`);
              if (paramValue) {
                if (!params.filters) params.filters = {};
                if (!params.filters[field.fieldName]) params.filters[field.fieldName] = {};
                params.filters[field.fieldName][op] = paramValue;
                hasRange = true;
              }
            });
          }
        } else {
          // For other field types, use direct fieldName
          const paramValue = searchParams.get(field.fieldName);
          if (paramValue) {
            if (!params.filters) params.filters = {};
            // For multiple values, send as comma-separated string
            // Backend should handle splitting if needed
            params.filters[field.fieldName] = paramValue;
          }
        }
      });
    }
    
    // Get sort params for initial load
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
    staleTime: 15 * 60 * 1000, // Increased to 15 minutes for client-side (data rarely changes)
    enabled: !isDataLoaded, // Only fetch once (unless refresh triggered)
  });

  // Handle refresh trigger from URL parameter (from form save redirect)
  React.useEffect(() => {
    if (refreshTrigger) {
      console.log("🔄 [CLIENT-SIDE] Refresh triggered from URL parameter:", refreshTrigger);

      // Clear cache and refetch fresh data
      setCachedFullData(null);
      setIsDataLoaded(false);

      // Remove the refresh parameter from URL without triggering navigation
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('_refresh');
      const newUrl = newSearchParams.toString()
        ? `${pathname}?${newSearchParams.toString()}`
        : pathname;
      router.replace(newUrl);
    }
  }, [refreshTrigger, searchParams, pathname, router]);

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

  // Pagination handlers for client-side pagination (URL state management only)
  const handlePageChange = React.useCallback((page: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', page.toString());
    
    console.log(`📱 [CLIENT-SIDE] Page change: ${page} (debounced 200ms)`);
    debouncedNavigate(`${pathname}?${newSearchParams.toString()}`, 200); // Fast debounce for pagination
  }, [searchParams, pathname, debouncedNavigate]);

  const handlePageSizeChange = React.useCallback((pageSize: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('limit', pageSize.toString());
    newSearchParams.set('page', '1'); // Reset to first page when changing page size
    
    console.log(`📱 [CLIENT-SIDE] Page size change: ${pageSize} (debounced 300ms)`);
    debouncedNavigate(`${pathname}?${newSearchParams.toString()}`, 300); // Medium debounce for page size
  }, [searchParams, pathname, debouncedNavigate]);

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
    
    console.log(`📱 [CLIENT-SIDE] Sort change: ${sortField} ${newSortOrder} (debounced 250ms)`);
    debouncedNavigate(`${pathname}?${newSearchParams.toString()}`, 250); // Fast debounce for sorting
  }, [searchParams, pathname, debouncedNavigate]);

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
  // Check for error state - use enhanced error display
  if (error) {
    return (
      <ModuleErrorDisplay
        error={error}
        module={module.slug}
        onRetry={() => {
          setCachedFullData(null);
          setIsDataLoaded(false);
          refetch();
        }}
        isRetrying={isFetching}
      />
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

  // Apply client-side filtering based on URL prefilter params
  let filteredData = sortedData;

  // Build filter object from URL params
  const activeFilters: Record<string, any> = {};
  if (module.dataTableSchema?.prefilters?.fields) {
    module.dataTableSchema.prefilters.fields.forEach((field: any) => {
      if (field.type === 'text') {
        // Check for operator-based params
        const operators = field.searchOptions?.operators || [{ value: '$regex' }, { value: '$eq' }];
        for (const op of operators) {
          const paramValue = searchParams.get(`${field.fieldName}[${op.value}]`);
          if (paramValue) {
            activeFilters[field.fieldName] = { value: paramValue, operator: op.value };
            break;
          }
        }
      } else {
        // For select, dynamicSelect, and other fields
        const paramValue = searchParams.get(field.fieldName);
        if (paramValue) {
          activeFilters[field.fieldName] = { value: paramValue, operator: '$eq' };
        }
      }
    });
  }

  // Apply filters to data
  if (Object.keys(activeFilters).length > 0) {
    filteredData = sortedData.filter((item: any) => {
      return Object.entries(activeFilters).every(([fieldName, filterConfig]) => {
        const itemValue = item[fieldName];
        const filterValue = filterConfig.value;
        const operator = filterConfig.operator;

        // Handle null/undefined
        if (itemValue === null || itemValue === undefined) return false;

        // Apply operator
        if (operator === '$regex') {
          // Case-insensitive partial match
          return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
        } else if (operator === '$eq') {
          // Exact match (case-insensitive for strings)
          if (typeof itemValue === 'string' && typeof filterValue === 'string') {
            return itemValue.toLowerCase() === filterValue.toLowerCase();
          }
          return String(itemValue) === String(filterValue);
        }

        return true;
      });
    });

    console.log("📱 [CLIENT-SIDE] Filtering applied:", {
      originalCount: sortedData.length,
      filteredCount: filteredData.length,
      activeFilters
    });
  }

  // Client-side pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / currentPageSize);
  
  // Calculate slice boundaries for current page
  const startIndex = (currentPage - 1) * currentPageSize;
  const endIndex = startIndex + currentPageSize;
  
  // Slice data to show only current page
  const moduleData = filteredData.slice(startIndex, endIndex);

  console.log("📱 [CLIENT-SIDE] Rendering:", {
    totalRecords: fullModuleData.length,
    filteredRecords: filteredData.length,
    currentPage,
    pageSize: currentPageSize,
    startIndex,
    endIndex,
    displayingRecords: moduleData.length,
    totalPages,
    sortBy: currentSortBy,
    sortOrder: currentSortOrder,
    hasActiveFilters: Object.keys(activeFilters).length > 0
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
      userPermissions={userPermissions}
    />
  );
}