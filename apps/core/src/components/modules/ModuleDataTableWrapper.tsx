"use client";

import React from "react";
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
 * Determines the appropriate pagination strategy based on module schema configuration
 * and routes to the specialized pagination component.
 * 
 * Schema-Based Detection Logic:
 * 1. Check module.dataTableSchema.pagination.isClientSidePaging hint
 * 2. Fallback: Use initialData presence to determine strategy
 * 3. Route to appropriate pagination wrapper immediately (no API detection call)
 * 
 * Benefits:
 * - Eliminates duplicate API calls during detection
 * - Faster loading (no detection delay) 
 * - Explicit configuration through schema
 */
export function ModuleDataTableWrapper({
  module,
  initialData = [],
}: ModuleDataTableWrapperProps) {
  const { currentLanguage } = useLanguage();

  // Determine pagination type from schema configuration (no API call needed)
  const paginationType = React.useMemo(() => {
    const paginationConfig = module.dataTableSchema.pagination;
    
    // If schema explicitly defines pagination strategy, use it
    if (paginationConfig?.isClientSidePaging === true) {
      console.log("🧠 [ROUTER] Pagination type from schema: CLIENT-SIDE (isClientSidePaging: true)");
      return 'client-side';
    }
    
    if (paginationConfig?.isClientSidePaging === false) {
      console.log("🧠 [ROUTER] Pagination type from schema: SERVER-SIDE (isClientSidePaging: false)");
      return 'server-side';
    }
    
    // Fallback: Use initialData presence as hint
    if (initialData && initialData.length > 0) {
      console.log("🧠 [ROUTER] Pagination type from initialData: CLIENT-SIDE (has initial data)");
      return 'client-side';
    }
    
    // Default to server-side pagination if no explicit configuration
    console.log("🧠 [ROUTER] Pagination type default: SERVER-SIDE (no schema hint, no initial data)");
    return 'server-side';
  }, [module.dataTableSchema.pagination, initialData]);

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