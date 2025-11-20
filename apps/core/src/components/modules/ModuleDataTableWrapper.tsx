"use client";

import React from "react";
import type { ModuleSchema } from "@repo/types";
import type { ModulePermissions } from "@/types/layout";
import { ServerSidePaginationWrapper } from "./ServerSidePaginationWrapper";

interface ModuleDataTableWrapperProps {
  module: ModuleSchema;
  initialData?: any[];
  userPermissions?: ModulePermissions;
}

/**
 * Module Data Table Wrapper
 *
 * Always uses server-side pagination for all modules.
 * Client-side pagination has been removed for consistency and simplicity.
 *
 * Benefits:
 * - Consistent pagination behavior across all modules
 * - Better performance for large datasets
 * - Reduced memory usage on client
 * - Simplified codebase
 */
export function ModuleDataTableWrapper({
  module,
  initialData = [],
  userPermissions,
}: ModuleDataTableWrapperProps) {
  console.log("🧠 [ROUTER] Using SERVER-SIDE pagination for module:", module.slug);

  return (
    <ServerSidePaginationWrapper
      module={module}
      initialData={initialData}
      userPermissions={userPermissions}
    />
  );
}