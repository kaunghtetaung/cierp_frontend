"use client";

import React from "react";
import { useModuleList } from "@repo/schema-hooks";
import { IconComponent } from "@repo/ui";
import { useLanguage } from "@repo/language";
import type { ModuleSchema } from "@repo/types";
import { ServerSidePaginationWrapper } from "./ServerSidePaginationWrapper";
import { ClientSidePaginationWrapper } from "./ClientSidePaginationWrapper";

interface ModuleDataTableWrapperProps {
  module: ModuleSchema;
  initialData?: any[];
}

/**
 * Smart Pagination Router
 * 
 * Determines the appropriate pagination strategy based on API response characteristics
 * and routes to the specialized pagination component.
 * 
 * Detection Logic:
 * 1. Make initial API call to sample response structure
 * 2. Check if response includes pagination metadata (totalPages, total, etc.)
 * 3. Route to ServerSidePaginationWrapper if pagination metadata found
 * 4. Route to ClientSidePaginationWrapper if plain array or large dataset without metadata
 */
export function ModuleDataTableWrapper({
  module,
  initialData = [],
}: ModuleDataTableWrapperProps) {
  const { currentLanguage } = useLanguage();
  const [paginationType, setPaginationType] = React.useState<'detecting' | 'server-side' | 'client-side'>('detecting');
  const [detectionError, setDetectionError] = React.useState<string | null>(null);

  // Make a lightweight API call to detect pagination type
  const {
    data: detectionResponse,
    isLoading: isDetecting,
    error: detectionApiError,
  } = useModuleList(module.slug, { page: 1, limit: 1 }, {
    enabled: paginationType === 'detecting',
    staleTime: 0, // Always fresh for detection
  });

  // Detect pagination type based on API response
  React.useEffect(() => {
    if (paginationType !== 'detecting') return;

    // If we have initial data, analyze it first
    if (initialData && initialData.length > 0) {
      // Initial data is typically a full array without pagination
      setPaginationType('client-side');
      console.log("🧠 [ROUTER] Pagination type detected from initialData: CLIENT-SIDE");
      return;
    }

    // If API response is available, analyze it
    if (detectionResponse) {
      const pagination = detectionResponse.pagination;
      const hasRealPagination = !!(pagination && (pagination.totalPages || pagination.total));
      
      if (hasRealPagination) {
        setPaginationType('server-side');
        console.log("🧠 [ROUTER] Pagination type detected from API: SERVER-SIDE", {
          pagination,
          totalPages: pagination?.totalPages,
          total: pagination?.total
        });
      } else {
        setPaginationType('client-side');
        console.log("🧠 [ROUTER] Pagination type detected from API: CLIENT-SIDE", {
          dataLength: Array.isArray(detectionResponse.data) ? detectionResponse.data.length : 0,
          hasPagination: !!pagination
        });
      }
    }

    // Handle detection errors
    if (detectionApiError) {
      setDetectionError(detectionApiError instanceof Error ? detectionApiError.message : "Detection failed");
    }
  }, [detectionResponse, initialData, paginationType, detectionApiError]);

  // Show loading state during detection
  if (paginationType === 'detecting') {
    if (detectionError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <IconComponent name="AlertCircle" className="w-12 h-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {currentLanguage === "mm" ? "အချက်အလက် ရယူ၍ မရပါ" : "Failed to detect pagination type"}
          </h3>
          <p className="text-muted-foreground mb-4">{detectionError}</p>
          <button
            onClick={() => {
              setDetectionError(null);
              setPaginationType('detecting');
            }}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <IconComponent name="RotateCcw" className="w-4 h-4 mr-2" />
            {currentLanguage === "mm" ? "ပြန်လည်ကြိုးစားမည်" : "Retry"}
          </button>
        </div>
      );
    }

    if (isDetecting) {
      return (
        <div className="flex items-center justify-center p-8">
          <IconComponent name="Loader2" className="w-8 h-8 animate-spin mr-2" />
          <span className="text-muted-foreground">
            {currentLanguage === "mm" ? "စနစ်ကို စစ်ဆေးနေပါသည်..." : "Detecting pagination type..."}
          </span>
        </div>
      );
    }
  }

  // Route to appropriate pagination component
  if (paginationType === 'server-side') {
    return <ServerSidePaginationWrapper module={module} initialData={initialData} />;
  }

  if (paginationType === 'client-side') {
    return <ClientSidePaginationWrapper module={module} initialData={initialData} />;
  }

  // Fallback (should not reach here)
  return (
    <div className="flex items-center justify-center p-8">
      <span className="text-muted-foreground">
        {currentLanguage === "mm" ? "စနစ်ကို ပြင်ဆင်နေပါသည်..." : "Initializing..."}
      </span>
    </div>
  );
}