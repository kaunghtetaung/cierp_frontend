"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useModuleList } from "@repo/schema-hooks";
import { ModuleDataTable } from "./ModuleDataTable";
import { IconComponent } from "@repo/ui/components/icons";
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

  // Convert search params to query parameters
  const queryParams = React.useMemo(() => {
    const params: Record<string, any> = {};
    
    // Get pagination params
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    
    if (page) params.page = parseInt(page);
    if (limit) params.limit = parseInt(limit);
    
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
    
    // Get sort params
    const sort = searchParams.get('sort');
    const order = searchParams.get('order');
    if (sort) params.sort = sort;
    if (order) params.order = order;
    
    return params;
  }, [searchParams]);

  // Fetch data using React Query
  const {
    data: moduleData = initialData,
    isLoading,
    error,
    refetch,
  } = useModuleList(module.slug, queryParams, {
    initialData: initialData,
    staleTime: 0, // Always refetch to ensure fresh data
  });

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

  return (
    <ModuleDataTable 
      module={module} 
      data={moduleData}
      totalItems={moduleData.length}
      totalPages={1}
    />
  );
}