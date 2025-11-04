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

interface ServerSidePaginationWrapperProps {
  module: ModuleSchema;
  initialData?: any[];
  userPermissions?: ModulePermissions;
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
  userPermissions,
}: ServerSidePaginationWrapperProps) {
  const { currentLanguage } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Check for refresh trigger from form save redirect
  const refreshTrigger = searchParams.get('_refresh');

  // Build query parameters for server-side pagination
  const queryParams = React.useMemo(() => {
    const params: Record<string, any> = {};

    // Always include page and limit parameters for server-side paging
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    params.page = page ? parseInt(page) : 1;
    params.limit = limit
      ? parseInt(limit)
      : module.dataTableSchema.pagination?.defaultLimit || 10;

    // Get filter params
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith("filter[") && key.endsWith("]")) {
        const fieldName = key.slice(7, -1);
        if (!params.filters) params.filters = {};
        if (!params.filters[fieldName]) params.filters[fieldName] = {};
        params.filters[fieldName]["$regex"] = value;
      }
    }

    // Get prefilter params - handle text fields with operators
    if (module.dataTableSchema?.prefilters?.fields) {
      module.dataTableSchema.prefilters.fields.forEach((field: any) => {
        if (field.type === "text") {
          // Check for operator-based params for text fields
          const operators = field.searchOptions?.operators || [
            { value: "$regex" },
            { value: "$eq" },
          ];
          for (const op of operators) {
            const paramValue = searchParams.get(
              `${field.fieldName}[${op.value}]`
            );
            if (paramValue) {
              if (!params.filters) params.filters = {};
              // Send with operator structure for backend
              if (!params.filters[field.fieldName])
                params.filters[field.fieldName] = {};
              params.filters[field.fieldName][op.value] = paramValue;
              break;
            }
          }
        } else if (field.type === "yearRange") {
          // Check for year range params
          const exactValue =
            searchParams.get(field.fieldName) ||
            searchParams.get(`${field.fieldName}[$eq]`);
          if (exactValue) {
            if (!params.filters) params.filters = {};
            params.filters[field.fieldName] = exactValue;
          } else {
            // Check for range operators
            const rangeOps = ["$gte", "$lte", "$gt", "$lt"];
            let hasRange = false;
            rangeOps.forEach((op) => {
              const paramValue = searchParams.get(`${field.fieldName}[${op}]`);
              if (paramValue) {
                if (!params.filters) params.filters = {};
                if (!params.filters[field.fieldName])
                  params.filters[field.fieldName] = {};
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

    // Get sort params (using sortBy and sortOrder to match backend API)
    const sortBy = searchParams.get("sortBy") || searchParams.get("sort");
    const sortOrder =
      searchParams.get("sortOrder") || searchParams.get("order");

    // Apply default sort if no sort is specified
    if (
      !sortBy &&
      module.dataTableSchema?.sorting?.enabled &&
      module.dataTableSchema?.sorting?.defaultSort
    ) {
      params.sort = module.dataTableSchema.sorting.defaultSort.field;
      params.order = module.dataTableSchema.sorting.defaultSort.direction;
    } else {
      if (sortBy) params.sort = sortBy;
      if (sortOrder) params.order = sortOrder as "asc" | "desc";
    }

    return params;
  }, [searchParams, module.dataTableSchema]);

  console.log("🖥️ [SERVER-SIDE] Pagination Debug:", {
    module: module.slug,
    queryParams,
    mode: "SERVER_SIDE_PAGINATION",
  });

  // Fetch data using React Query - always enabled for server-side pagination
  const {
    data: moduleResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useModuleList(module.slug, queryParams, {
    initialData:
      initialData && initialData.length > 0 ? initialData : undefined,
    staleTime: 8 * 60 * 1000, // Increased to 8 minutes for better performance
    enabled: true, // Always enabled for server-side pagination
  });

  // Handle refresh trigger from URL parameter (from form save redirect)
  React.useEffect(() => {
    if (refreshTrigger) {
      console.log("🖥️ [SERVER-SIDE] Refresh triggered from URL parameter:", refreshTrigger);

      // Trigger immediate refetch
      refetch();

      // Remove the refresh parameter from URL without triggering navigation
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('_refresh');
      const newUrl = newSearchParams.toString()
        ? `${pathname}?${newSearchParams.toString()}`
        : pathname;
      router.replace(newUrl);
    }
  }, [refreshTrigger, refetch, searchParams, pathname, router]);

  // Debounced navigation to prevent rapid-fire API calls
  const debouncedNavigate = React.useCallback(
    (url: string, delay: number = 300) => {
      // Clear any existing timeout
      if (debouncedNavigate.timeoutId) {
        clearTimeout(debouncedNavigate.timeoutId);
      }

      // Set new timeout
      debouncedNavigate.timeoutId = setTimeout(() => {
        router.push(url);
        debouncedNavigate.timeoutId = null;
      }, delay);
    },
    [router]
  ) as any;

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
  const handlePageChange = React.useCallback(
    (page: number) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set("page", page.toString());

      console.log(`🖥️ [SERVER-SIDE] Page change: ${page} (debounced 200ms)`);
      debouncedNavigate(`${pathname}?${newSearchParams.toString()}`, 200); // Fast debounce for pagination
    },
    [searchParams, pathname, debouncedNavigate]
  );

  const handlePageSizeChange = React.useCallback(
    (pageSize: number) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set("limit", pageSize.toString());
      newSearchParams.set("page", "1"); // Reset to first page when changing page size

      console.log(
        `🖥️ [SERVER-SIDE] Page size change: ${pageSize} (debounced 300ms)`
      );
      debouncedNavigate(`${pathname}?${newSearchParams.toString()}`, 300); // Medium debounce for page size
    },
    [searchParams, pathname, debouncedNavigate]
  );

  const handleSort = React.useCallback(
    (sortField: string) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      const currentSortBy = searchParams.get("sortBy");
      const currentSortOrder = searchParams.get("sortOrder") || "asc";

      // Toggle sort order if clicking the same column, otherwise default to 'asc'
      const newSortOrder =
        currentSortBy === sortField && currentSortOrder === "asc"
          ? "desc"
          : "asc";

      newSearchParams.set("sortBy", sortField);
      newSearchParams.set("sortOrder", newSortOrder);
      newSearchParams.set("page", "1"); // Reset to first page when sorting changes

      console.log(
        `🖥️ [SERVER-SIDE] Sort change: ${sortField} ${newSortOrder} (debounced 250ms)`
      );
      debouncedNavigate(`${pathname}?${newSearchParams.toString()}`, 250); // Fast debounce for sorting
    },
    [searchParams, pathname, debouncedNavigate]
  );

  // Extract data and pagination from response
  const moduleData = Array.isArray(moduleResponse?.data)
    ? moduleResponse.data
    : Array.isArray(initialData)
    ? initialData
    : [];
  const pagination = moduleResponse?.pagination;

  // Check for error state - use enhanced error display
  if (error) {
    return (
      <ModuleErrorDisplay
        error={error}
        module={module.slug}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  // Check for loading state - use new improved loading UI
  if (isLoading && !moduleData.length) {
    // Dynamic import the loading component for better code splitting
    const ModuleLoading = React.lazy(() => import('../../app/[appId]/[module]/loading'));
    return (
      <React.Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <IconComponent name="Loader2" className="h-8 w-8 animate-spin text-primary/60" />
        </div>
      }>
        <ModuleLoading />
      </React.Suspense>
    );
  }

  // Get current page and pagination info
  const currentPage = searchParams.get("page")
    ? parseInt(searchParams.get("page")!)
    : 1;
  const currentPageSize = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : module.dataTableSchema.pagination?.defaultLimit || 10;
  const currentSortBy = searchParams.get("sortBy") || undefined;
  const currentSortOrder = (searchParams.get("sortOrder") || "asc") as
    | "asc"
    | "desc";

  const totalItems = pagination?.total || moduleData.length;
  const totalPages = pagination?.totalPages || 1;

  console.log("🖥️ [SERVER-SIDE] Rendering:", {
    dataLength: moduleData.length,
    totalItems,
    totalPages,
    currentPage,
    currentPageSize,
    hasPaginationMetadata: !!pagination,
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
      userPermissions={userPermissions}
    />
  );
}
